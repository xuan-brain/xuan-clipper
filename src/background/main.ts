import type { Tabs } from "webextension-polyfill";
import type {ExportMarkdownResponse, PageTypeResponse} from "~/logic/messaging";
import { onMessage, sendMessage } from "webext-bridge/background";
import {
  
  MESSAGE_TYPES
  
} from "~/logic/messaging";

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

/**
 * 创建显示 Markdown 的 HTML 页面
 */
function createMarkdownHtml(markdown: string): string {
  // 转义 HTML 特殊字符
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
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
      background: #fafafa;
    }
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 14px;
      line-height: 1.5;
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <pre>${escapedMarkdown}</pre>
</body>
</html>`;
}
