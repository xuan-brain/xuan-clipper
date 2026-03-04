import type {AutoSendPaperHtmlResponse, ExportMarkdownResponse, ImportClipsResponse, ImportPaperResponse, PageTypeResponse} from "~/logic/messaging";
import { createApp } from "vue";
import { onMessage, sendMessage } from "webext-bridge/content-script";
import i18n from "~/locales";
import { setupApp } from "~/logic/common-setup";
import { convertToMarkdown } from "~/logic/markdown-converter";
import { MESSAGE_TYPES } from "~/logic/messaging";
import { pageDetector } from "~/logic/page-detector";
import { extractPaperContent } from "~/logic/paper-extractor";
import { extractWebpageMetadata } from "~/logic/webpage-metadata-extractor";
import App from "./views/App.vue";

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  console.info("[xuan-clipper] Hello world from content script");

  // communication example: send previous tab title from background page
  onMessage("tab-prev", ({ data }) => {
    console.log(`[xuan-clipper] Navigate from page "${data.title}"`);
  });

  // 处理页面类型查询请求
  onMessage(
    MESSAGE_TYPES.GET_PAGE_TYPE,
    async (): Promise<PageTypeResponse> => {
      try {
        const result = await pageDetector.detect(
          window.location.href,
          document,
        );
        return {
          success: true,
          result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  );

  // 处理导入论文操作
  onMessage(
    MESSAGE_TYPES.IMPORT_PAPER,
    async (): Promise<ImportPaperResponse> => {
      console.log("[xuan-clipper] Import paper triggered");
      try {
        // 提取论文主体内容
        const content = extractPaperContent(document);

        return {
          success: true,
          content,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  );

  // 处理导出 Markdown 操作
  onMessage(
    MESSAGE_TYPES.EXPORT_MARKDOWN,
    async (): Promise<ExportMarkdownResponse> => {
      console.log("[xuan-clipper] Export markdown triggered");
      try {
        const markdown = convertToMarkdown(document);
        return {
          success: true,
          markdown,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  );

  // 处理导入 Clips 操作
  onMessage(
    MESSAGE_TYPES.IMPORT_CLIPS,
    async (): Promise<ImportClipsResponse> => {
      console.log("[xuan-clipper] Import clips triggered");
      try {
        // 提取网页元数据
        const metadata = extractWebpageMetadata(document, window.location.href);

        // 转换为 Markdown
        const markdown = convertToMarkdown(document);

        return {
          success: true,
          clipsData: {
            ...metadata,
            content: markdown,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  );

  // 页面类型检测
  async function detectPageType() {
    try {
      const result = await pageDetector.detect(window.location.href, document);
      if (result.pageType === "paper") {
        console.log("[xuan-clipper] 检测到论文页面", {
          platform: result.platform,
          source: result.source,
          confidence: result.confidence,
          url: window.location.href,
        });

        // 自动发送论文 HTML 到本地服务器
        sendPaperHtml();
      } else {
        console.log("[xuan-clipper] 检测到普通网页", {
          source: result.source,
          confidence: result.confidence,
          url: window.location.href,
        });
      }
    } catch (error) {
      console.error("[xuan-clipper] 页面类型检测失败", error);
    }
  }

  // 发送论文 HTML 到本地服务器（通过 background 避免跨域问题）
  async function sendPaperHtml() {
    try {
      const html = extractPaperContent(document);

      const response = await sendMessage<AutoSendPaperHtmlResponse>(
        MESSAGE_TYPES.AUTO_SEND_PAPER_HTML,
        { html, url: window.location.href },
        { context: "background" },
      );

      if (response.success && response.result) {
        console.log("[xuan-clipper] 服务器返回:", response.result);

        // 尝试解析 JSON 并触发事件显示元数据面板
        try {
          const metadataList = JSON.parse(response.result);
          if (Array.isArray(metadataList) && metadataList.length > 0) {
            const metadata = metadataList[0];
            // 发送自定义事件到 Vue 组件
            window.dispatchEvent(new CustomEvent("xuan-clipper-paper-metadata", {
              detail: metadata,
            }));
          }
        } catch {
          console.log("[xuan-clipper] 返回内容不是有效 JSON，跳过元数据展示");
        }
      } else {
        console.error("[xuan-clipper] 发送论文 HTML 失败:", response.error);
      }
    } catch (error) {
      console.error("[xuan-clipper] 发送论文 HTML 失败:", error);
    }
  }

  // 根据文档加载状态决定何时检测
  if (document.readyState === "complete") {
    detectPageType();
  } else {
    window.addEventListener("load", detectPageType);
  }

  // mount component to context window
  const container = document.createElement("div");
  container.id = __NAME__;
  const root = document.createElement("div");
  const styleEl = document.createElement("link");
  const shadowDOM =
    container.attachShadow?.({ mode: __DEV__ ? "open" : "closed" }) ||
    container;
  styleEl.setAttribute("rel", "stylesheet");
  styleEl.setAttribute(
    "href",
    browser.runtime.getURL("dist/contentScripts/style.css"),
  );
  shadowDOM.appendChild(styleEl);
  shadowDOM.appendChild(root);
  document.body.appendChild(container);
  const app = createApp(App);
  setupApp(app);
  app.use(i18n);
  app.mount(root);
})();
