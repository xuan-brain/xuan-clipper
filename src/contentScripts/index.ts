 
import { createApp } from "vue";
import { onMessage } from "webext-bridge/content-script";
import { setupApp } from "~/logic/common-setup";
import { pageDetector } from "~/logic/page-detector";
import App from "./views/App.vue";

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  console.info("[vitesse-webext] Hello world from content script");

  // communication example: send previous tab title from background page
  onMessage("tab-prev", ({ data }) => {
    console.log(`[vitesse-webext] Navigate from page "${data.title}"`);
  });

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
  app.mount(root);
})();
