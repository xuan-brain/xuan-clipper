import type { Tabs } from "webextension-polyfill";
import type {PageTypeResponse} from "~/logic/messaging";
import { onMessage, sendMessage } from "webext-bridge/background";
import { MESSAGE_TYPES  } from "~/logic/messaging";

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
