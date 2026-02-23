import type { Tabs } from "webextension-polyfill";
import type {
  ClipsData,
  ExportMarkdownResponse,
  ImportClipsResponse,
  ImportPaperResponse,
  PageTypeResponse,
} from "~/logic/messaging";
import { marked } from "marked";
import { onMessage, sendMessage } from "webext-bridge/background";
import { getMessages } from "~/locales";
import { MESSAGE_TYPES } from "~/logic/messaging";
import { apiConfig, clipsApiConfig } from "~/logic/storage";

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import("/@vite/client");
  // load latest content script
  import("./contentScriptHMR");
}

// 使用 popup 而不是 side panel
const USE_SIDE_PANEL = false;

// to toggle the sidepanel with the action button in chromium:
if (USE_SIDE_PANEL) {
  // @ts-expect-error missing types
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: unknown) => console.error(error));
}

browser.runtime.onInstalled.addListener((): void => {
  console.log("Extension installed");
});

let previousTabId = 0;

// communication example: send previous tab title from background page
// see shim.d.ts for type declaration
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!previousTabId) {
    previousTabId = tabId;
    return;
  }

  let tab: Tabs.Tab;

  try {
    tab = await browser.tabs.get(previousTabId);
    previousTabId = tabId;
  } catch {
    return;
  }

  console.log("previous tab", tab);
  sendMessage(
    "tab-prev",
    { title: tab.title },
    { context: "content-script", tabId },
  );
});

onMessage("get-current-tab", async () => {
  try {
    const tab = await browser.tabs.get(previousTabId);
    return {
      title: tab?.title,
    };
  } catch {
    return {
      title: undefined,
    };
  }
});

// 路由页面类型查询请求: Popup -> Background -> Content Script
onMessage(MESSAGE_TYPES.GET_PAGE_TYPE, async (): Promise<PageTypeResponse> => {
  // 获取当前窗口的活动标签页
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    return { success: false, error: "No active tab found" };
  }

  // 检查是否为受限页面 (chrome://, edge://, about:, etc.)
  if (
    tab.url?.startsWith("chrome://") ||
    tab.url?.startsWith("edge://") ||
    tab.url?.startsWith("about:") ||
    tab.url?.startsWith("chrome-extension://") ||
    tab.url?.startsWith("moz-extension://")
  ) {
    return {
      success: false,
      error: "Cannot access this page",
      result: { pageType: "webpage", confidence: 0.5, source: "url" },
    };
  }

  try {
    // 转发到 Content Script
    const response = await sendMessage<PageTypeResponse>(
      MESSAGE_TYPES.GET_PAGE_TYPE,
      {},
      { context: "content-script", tabId: tab.id },
    );
    return response;
  } catch {
    // Content Script 可能尚未加载
    return {
      success: false,
      error: "Content script not available",
      result: { pageType: "webpage", confidence: 0.5, source: "url" },
    };
  }
});

// 处理导出 Markdown 请求: Popup -> Background -> Content Script -> 打开新 Tab
onMessage(
  MESSAGE_TYPES.EXPORT_MARKDOWN,
  async (): Promise<ExportMarkdownResponse> => {
    // 获取当前窗口的活动标签页
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      return { success: false, error: "No active tab found" };
    }

    // 检查是否为受限页面
    if (
      tab.url?.startsWith("chrome://") ||
      tab.url?.startsWith("edge://") ||
      tab.url?.startsWith("about:") ||
      tab.url?.startsWith("chrome-extension://") ||
      tab.url?.startsWith("moz-extension://")
    ) {
      return { success: false, error: "Cannot access this page" };
    }

    try {
      // 转发到 Content Script 获取 Markdown
      const response = await sendMessage<ExportMarkdownResponse>(
        MESSAGE_TYPES.EXPORT_MARKDOWN,
        {},
        { context: "content-script", tabId: tab.id },
      );

      if (response.success && response.markdown) {
        // 创建 HTML 页面显示 Markdown
        const htmlContent = createMarkdownHtml(response.markdown);
        const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

        // 打开新 Tab
        await browser.tabs.create({ url: dataUrl });
      }

      return response;
    } catch {
      return {
        success: false,
        error: "Content script not available",
      };
    }
  },
);

// 处理导入论文请求: Popup -> Background -> Content Script -> 调用API -> 显示通知
onMessage(
  MESSAGE_TYPES.IMPORT_PAPER,
  async (): Promise<ImportPaperResponse> => {
    console.log("[xuan-clipper] IMPORT_PAPER message received");
    const i18n = getMessages();

    // 获取当前窗口的活动标签页
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    console.log("[xuan-clipper] Active tab:", tab?.id, tab?.url);

    if (!tab?.id) {
      console.log("[xuan-clipper] No active tab, showing notification");
      await showNotification(i18n.notifications?.importFailed || "Import Failed", "No active tab found");
      return { success: false, error: "No active tab found" };
    }

    // 检查是否为受限页面
    if (
      tab.url?.startsWith("chrome://") ||
      tab.url?.startsWith("edge://") ||
      tab.url?.startsWith("about:") ||
      tab.url?.startsWith("chrome-extension://") ||
      tab.url?.startsWith("moz-extension://")
    ) {
      console.log("[xuan-clipper] Restricted page, showing notification");
      await showNotification(i18n.notifications?.importFailed || "Import Failed", "Cannot access this page");
      return { success: false, error: "Cannot access this page" };
    }

    try {
      // 转发到 Content Script 获取论文内容
      console.log("[xuan-clipper] Sending message to content script...");
      const response = await sendMessage<ImportPaperResponse>(
        MESSAGE_TYPES.IMPORT_PAPER,
        {},
        { context: "content-script", tabId: tab.id },
      );
      console.log("[xuan-clipper] Content script response:", response.success, response.content?.length);

      if (!response.success || !response.content) {
        console.log("[xuan-clipper] Content extraction failed, showing notification");
        await showNotification(
          i18n.notifications?.importFailed || "Import Failed",
          response.error || i18n.notifications?.extractFailed || "Failed to extract content",
        );
        return { success: false, error: response.error };
      }

      // 发送到 API
      console.log("[xuan-clipper] Sending to API...");
      const apiResult = await sendHtmlToApi(response.content);
      console.log("[xuan-clipper] API result:", apiResult);

      if (apiResult.success) {
        console.log("[xuan-clipper] API success, showing notification");
        await showNotification(
          i18n.notifications?.importSuccess || "Import Successful",
          i18n.notifications?.importSuccessMessage || "Paper has been sent to local program",
        );
      } else {
        console.log("[xuan-clipper] API failed, showing notification");
        await showNotification(
          i18n.notifications?.importFailed || "Import Failed",
          apiResult.error || i18n.notifications?.networkError || "Network error",
        );
      }

      return {
        success: true,
        content: response.content,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[xuan-clipper] Error in IMPORT_PAPER handler:", error);
      await showNotification(i18n.notifications?.importFailed || "Import Failed", errorMessage);
      return { success: false, error: errorMessage };
    }
  },
);

// 处理导入 Clips 请求: Popup -> Background -> Content Script -> 调用API -> 显示通知
onMessage(
  MESSAGE_TYPES.IMPORT_CLIPS,
  async (): Promise<ImportClipsResponse> => {
    console.log("[xuan-clipper] IMPORT_CLIPS message received");
    const i18n = getMessages();

    // 获取当前窗口的活动标签页
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    console.log("[xuan-clipper] Active tab:", tab?.id, tab?.url);

    if (!tab?.id) {
      console.log("[xuan-clipper] No active tab, showing notification");
      await showNotification(i18n.notifications?.importFailed || "Import Failed", "No active tab found");
      return { success: false, error: "No active tab found" };
    }

    // 检查是否为受限页面
    if (
      tab.url?.startsWith("chrome://") ||
      tab.url?.startsWith("edge://") ||
      tab.url?.startsWith("about:") ||
      tab.url?.startsWith("chrome-extension://") ||
      tab.url?.startsWith("moz-extension://")
    ) {
      console.log("[xuan-clipper] Restricted page, showing notification");
      await showNotification(i18n.notifications?.importFailed || "Import Failed", "Cannot access this page");
      return { success: false, error: "Cannot access this page" };
    }

    try {
      // 转发到 Content Script 获取 Clips 数据
      console.log("[xuan-clipper] Sending message to content script...");
      const response = await sendMessage<ImportClipsResponse>(
        MESSAGE_TYPES.IMPORT_CLIPS,
        {},
        { context: "content-script", tabId: tab.id },
      );
      console.log("[xuan-clipper] Content script response:", response.success);

      if (!response.success || !response.clipsData) {
        console.log("[xuan-clipper] Content extraction failed, showing notification");
        await showNotification(
          i18n.notifications?.importFailed || "Import Failed",
          response.error || i18n.notifications?.clipsExtractFailed || "Failed to extract webpage metadata",
        );
        return { success: false, error: response.error };
      }

      // 发送到 API
      console.log("[xuan-clipper] Sending to Clips API...");
      const apiResult = await sendClipsToApi(response.clipsData);
      console.log("[xuan-clipper] Clips API result:", apiResult);

      if (apiResult.success) {
        console.log("[xuan-clipper] Clips API success, showing notification");
        await showNotification(
          i18n.notifications?.clipsSuccess || i18n.notifications?.importSuccess || "Import Successful",
          i18n.notifications?.clipsSuccessMessage || "Webpage has been saved to clips",
        );
      } else {
        console.log("[xuan-clipper] Clips API failed, showing notification");
        await showNotification(
          i18n.notifications?.importFailed || "Import Failed",
          apiResult.error || i18n.notifications?.networkError || "Network error",
        );
      }

      return {
        success: true,
        clipsData: response.clipsData,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[xuan-clipper] Error in IMPORT_CLIPS handler:", error);
      await showNotification(i18n.notifications?.importFailed || "Import Failed", errorMessage);
      return { success: false, error: errorMessage };
    }
  },
);

/**
 * 发送 Clips 到 API
 */
async function sendClipsToApi(clipsData: ClipsData): Promise<{ success: boolean; error?: string }> {
  if (!clipsApiConfig.value.enabled) {
    return { success: false, error: "Clips API integration disabled" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), clipsApiConfig.value.timeout);

  try {
    const response = await fetch(clipsApiConfig.value.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clipsData),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, error: `Server error: ${response.status}` };
    }
    return { success: true };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, error: "Request timeout" };
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * 发送 HTML 到 API
 */
async function sendHtmlToApi(htmlContent: string): Promise<{ success: boolean; error?: string }> {
  if (!apiConfig.value.enabled) {
    return { success: false, error: "API integration disabled" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), apiConfig.value.timeout);

  try {
    const response = await fetch(apiConfig.value.endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: htmlContent,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, error: `Server error: ${response.status}` };
    }
    return { success: true };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, error: "Request timeout" };
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * 显示浏览器通知
 */
async function showNotification(title: string, message: string): Promise<void> {
  try {
    const notificationId = await browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("assets/64x64.png"),
      title,
      message,
    });
    console.log("[xuan-clipper] Notification created:", notificationId, title, message);
  } catch (error) {
    console.error("[xuan-clipper] Failed to create notification:", error);
  }
}

/**
 * 创建显示 Markdown 的 HTML 页面
 */
function createMarkdownHtml(markdown: string): string {
  // 获取当前语言的翻译
  const i18n = getMessages();

  // 使用 marked 渲染 Markdown 为 HTML
  const renderedHtml = marked.parse(markdown) as string;

  // 转义 Markdown 源码用于显示
  const escapedMarkdown = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <style>
    * { box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px 80px;
      line-height: 1.6;
      color: #333;
      background: #fafafa;
    }

    /* 工具栏 */
    .toolbar {
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
      z-index: 1000;
    }

    .toggle-btn, .copy-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .toggle-btn {
      background: #3b82f6;
      color: white;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }
    .toggle-btn:hover {
      background: #2563eb;
      transform: translateY(-1px);
    }

    .copy-btn {
      background: #10b981;
      color: white;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    }
    .copy-btn:hover {
      background: #059669;
      transform: translateY(-1px);
    }
    .copy-btn.success {
      background: #059669;
    }

    /* Markdown 源码样式 */
    .markdown-source {
      display: none;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
      font-size: 14px;
      line-height: 1.6;
      background: #fff;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .markdown-source.visible {
      display: block;
    }

    /* 渲染后的 Markdown 样式 */
    .markdown-rendered {
      background: #fff;
      padding: 24px 32px;
      border-radius: 12px;
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .markdown-rendered.hidden {
      display: none;
    }

    /* Markdown 元素样式 */
    .markdown-rendered h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; margin-top: 24px; }
    .markdown-rendered h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; margin-top: 20px; }
    .markdown-rendered h3 { font-size: 1.25em; margin-top: 16px; }
    .markdown-rendered h4 { font-size: 1em; margin-top: 16px; }
    .markdown-rendered p { margin: 1em 0; }
    .markdown-rendered a { color: #3b82f6; text-decoration: none; }
    .markdown-rendered a:hover { text-decoration: underline; }
    .markdown-rendered ul, .markdown-rendered ol { padding-left: 2em; margin: 1em 0; }
    .markdown-rendered li { margin: 0.5em 0; }
    .markdown-rendered blockquote {
      border-left: 4px solid #3b82f6;
      padding-left: 1em;
      margin: 1em 0;
      color: #666;
      background: #f8fafc;
      padding: 0.5em 1em;
      border-radius: 0 8px 8px 0;
    }
    .markdown-rendered code {
      background: #f1f5f9;
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 0.9em;
    }
    .markdown-rendered pre {
      background: #1e293b;
      color: #e2e8f0;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1em 0;
    }
    .markdown-rendered pre code {
      background: transparent;
      padding: 0;
      color: inherit;
    }
    .markdown-rendered img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1em 0;
    }
    .markdown-rendered table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    .markdown-rendered th, .markdown-rendered td {
      border: 1px solid #e0e0e0;
      padding: 8px 12px;
      text-align: left;
    }
    .markdown-rendered th {
      background: #f8fafc;
      font-weight: 600;
    }
    .markdown-rendered hr {
      border: none;
      border-top: 1px solid #e0e0e0;
      margin: 2em 0;
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="toggle-btn" id="toggleBtn">${i18n.markdownViewer.viewSource}</button>
    <button class="copy-btn" id="copyBtn">${i18n.markdownViewer.copy}</button>
  </div>

  <div class="markdown-rendered" id="rendered">
    ${renderedHtml}
  </div>

  <pre class="markdown-source" id="source">${escapedMarkdown}</pre>

  <script>
    (function() {
      var markdown = ${JSON.stringify(markdown)};
      var isSourceView = false;
      var toggleBtn = document.getElementById('toggleBtn');
      var copyBtn = document.getElementById('copyBtn');
      var rendered = document.getElementById('rendered');
      var source = document.getElementById('source');
      var viewSource = '${i18n.markdownViewer.viewSource}';
      var viewRendered = '${i18n.markdownViewer.viewRendered}';
      var copy = '${i18n.markdownViewer.copy}';
      var copied = '${i18n.markdownViewer.copied}';

      toggleBtn.onclick = function() {
        isSourceView = !isSourceView;
        if (isSourceView) {
          rendered.classList.add('hidden');
          source.classList.add('visible');
          toggleBtn.textContent = viewRendered;
        } else {
          rendered.classList.remove('hidden');
          source.classList.remove('visible');
          toggleBtn.textContent = viewSource;
        }
      };

      copyBtn.onclick = function() {
        navigator.clipboard.writeText(markdown).then(function() {
          copyBtn.textContent = copied;
          copyBtn.classList.add('success');
          setTimeout(function() {
            copyBtn.textContent = copy;
            copyBtn.classList.remove('success');
          }, 2000);
        });
      };
    })();
  <\/script>
</body>
</html>`;
}
