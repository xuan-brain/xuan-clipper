import type { Tabs } from "webextension-polyfill";
import type {
  ExportMarkdownResponse,
  ImportPaperResponse,
  PageTypeResponse,
} from "~/logic/messaging";
import { marked } from "marked";
import { onMessage, sendMessage } from "webext-bridge/background";
import { getMessages } from "~/locales";
import { MESSAGE_TYPES } from "~/logic/messaging";

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

// 处理导入论文请求: Popup -> Background -> Content Script -> 打开新 Tab
onMessage(
  MESSAGE_TYPES.IMPORT_PAPER,
  async (): Promise<ImportPaperResponse> => {
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
      // 转发到 Content Script 获取论文内容
      const response = await sendMessage<ImportPaperResponse>(
        MESSAGE_TYPES.IMPORT_PAPER,
        {},
        { context: "content-script", tabId: tab.id },
      );

      if (response.success && response.content) {
        // 创建论文查看器 HTML
        const htmlContent = createPaperViewerHtml(response.content);
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

/**
 * 创建论文查看器 HTML 页面
 * 直接显示原始 HTML 内容
 */
function createPaperViewerHtml(htmlContent: string): string {
  const i18n = getMessages();

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Paper Content</title>
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
      background: #10b981;
      color: white;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    }
    .toggle-btn:hover {
      background: #059669;
      transform: translateY(-1px);
    }

    .copy-btn {
      background: #3b82f6;
      color: white;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }
    .copy-btn:hover {
      background: #2563eb;
      transform: translateY(-1px);
    }
    .copy-btn.success {
      background: #059669;
    }

    /* HTML 源码样式 */
    .html-source {
      display: none;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
      font-size: 12px;
      line-height: 1.5;
      background: #1e293b;
      color: #e2e8f0;
      padding: 24px;
      border-radius: 12px;
      overflow-x: auto;
    }
    .html-source.visible {
      display: block;
    }

    /* HTML 内容区块 */
    .paper-content {
      background: #fff;
      padding: 24px 32px;
      border-radius: 12px;
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .paper-content.hidden {
      display: none;
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="toggle-btn" id="toggleBtn">${i18n.paperViewer?.viewSource || "View Source"}</button>
    <button class="copy-btn" id="copyBtn">${i18n.paperViewer?.copy || "Copy"}</button>
  </div>

  <div class="paper-content" id="rendered">
    ${htmlContent}
  </div>

  <pre class="html-source" id="source"></pre>

  <script>
    (function() {
      var htmlContent = ${JSON.stringify(htmlContent)};
      var isSourceView = false;
      var toggleBtn = document.getElementById('toggleBtn');
      var copyBtn = document.getElementById('copyBtn');
      var rendered = document.getElementById('rendered');
      var source = document.getElementById('source');
      var viewSource = '${i18n.paperViewer?.viewSource || "View Source"}';
      var viewRendered = '${i18n.paperViewer?.viewRendered || "View Rendered"}';
      var copy = '${i18n.paperViewer?.copy || "Copy"}';
      var copied = '${i18n.paperViewer?.copied || "Copied"}';

      // 初始化源码显示
      source.textContent = htmlContent;

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
        navigator.clipboard.writeText(htmlContent).then(function() {
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
