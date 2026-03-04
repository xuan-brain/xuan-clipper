<script setup lang="ts">
import type { DetectionResult } from "~/logic/page-detector";
import { useToggle } from "@vueuse/core";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { convertToMarkdown } from "~/logic/markdown-converter";
import { pageDetector } from "~/logic/page-detector";
import { extractPaperContent } from "~/logic/paper-extractor";
import { extractWebpageMetadata } from "~/logic/webpage-metadata-extractor";
import "uno.css";

const { t } = useI18n();
const [show, toggle] = useToggle(false);

// 扩展图标 URL
const iconUrl = browser.runtime.getURL("assets/32x32.png");

// 状态
const loading = ref(true);
const error = ref<string>();
const pageTypeResult = ref<DetectionResult | null>(null);

// 检测页面类型
async function detectPageType() {
  loading.value = true;
  error.value = undefined;

  try {
    const result = await pageDetector.detect(window.location.href, document);
    pageTypeResult.value = result;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to detect page type";
    // 出错时默认为普通网页
    pageTypeResult.value = {
      pageType: "webpage",
      confidence: 0.5,
      source: "url",
    };
  } finally {
    loading.value = false;
  }
}

// 处理导入论文操作
async function handleImportPaper() {
  try {
    const content = extractPaperContent(document);
    console.log("[xuan-clipper] Paper content extracted:", content);
    // TODO: 发送到本地程序
  } catch (e) {
    console.error("Import paper failed:", e);
  }
}

// 处理导出 Markdown 操作
async function handleExportMarkdown() {
  try {
    const markdown = convertToMarkdown(document);
    console.log("[xuan-clipper] Markdown exported:", markdown);
    // TODO: 发送到本地程序或复制到剪贴板
  } catch (e) {
    console.error("Export markdown failed:", e);
  }
}

// 处理导入 Clips 操作
async function handleImportClips() {
  try {
    const metadata = extractWebpageMetadata(document, window.location.href);
    const markdown = convertToMarkdown(document);
    const clipsData = {
      ...metadata,
      content: markdown,
    };
    console.log("[xuan-clipper] Clips data:", clipsData);
    // TODO: 发送到本地程序
  } catch (e) {
    console.error("Import clips failed:", e);
  }
}

// 打开设置页面
function openOptionsPage() {
  browser.runtime.openOptionsPage();
}

// 组件挂载时检测页面类型
onMounted(() => {
  detectPageType();
});
</script>

<template>
  <div class="fixed right-0 bottom-0 m-5 z-[2147483647] flex items-end font-sans select-none leading-1em">
    <!-- 主面板 -->
    <div
      v-show="show"
      class="w-[320px] bg-white text-gray-700 rounded-lg shadow-lg mr-2 overflow-hidden"
      transition="opacity duration-300"
      :class="show ? 'opacity-100' : 'opacity-0'"
    >
      <main class="px-4 py-4">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-6">
          <div class="animate-spin i-carbon-renew text-2xl text-blue-500" />
          <span class="ml-2 text-gray-500">{{ t("popup.detecting") }}</span>
        </div>

        <!-- Content -->
        <div v-else class="space-y-3">
          <!-- Error Message -->
          <div
            v-if="error && !pageTypeResult"
            class="flex items-center text-red-500 text-sm"
          >
            <div class="i-carbon-warning-alt text-lg mr-2" />
            <span>{{ error }}</span>
          </div>

          <!-- Paper Page -->
          <div
            v-if="pageTypeResult?.pageType === 'paper'"
            class="bg-green-50 rounded-lg p-4"
          >
            <div class="flex items-center mb-2">
              <div class="i-carbon-document text-2xl text-green-600" />
              <div class="ml-2">
                <span class="font-semibold text-gray-800">{{
                  t("popup.paperPage")
                }}</span>
                <span
                  v-if="pageTypeResult.platform"
                  class="ml-2 text-sm text-gray-500"
                >
                  ({{ pageTypeResult.platform }})
                </span>
              </div>
            </div>
            <div class="text-xs text-gray-400 mb-3">
              {{ t("popup.detectionMethod") }}: {{ pageTypeResult.source }} ({{
                (pageTypeResult.confidence * 100).toFixed(0)
              }}%)
            </div>
            <button
              class="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
              @click="handleImportPaper"
            >
              <div class="i-carbon-add mr-2" />
              {{ t("popup.importPaper") }}
            </button>
          </div>

          <!-- Web Page -->
          <div v-else class="bg-blue-50 rounded-lg p-4">
            <div class="flex items-center mb-2">
              <div class="i-carbon-document-attachment text-2xl text-blue-600" />
              <span class="ml-2 font-semibold text-gray-800">{{
                t("popup.webPage")
              }}</span>
            </div>
            <div class="text-xs text-gray-400 mb-3">
              {{ t("popup.canConvertToMarkdown") }}
            </div>
            <div class="flex gap-2">
              <button
                class="flex-1 flex items-center justify-center px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
                @click="handleExportMarkdown"
              >
                <div class="i-carbon-download mr-2" />
                {{ t("popup.exportMarkdown") }}
              </button>
              <button
                class="flex-1 flex items-center justify-center px-4 py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
                @click="handleImportClips"
              >
                <div class="i-carbon-add mr-2" />
                {{ t("popup.importClips") }}
              </button>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <hr class="my-3 border-gray-200">

        <!-- Footer Actions -->
        <div class="flex justify-center gap-4 text-sm">
          <button
            class="text-gray-500 hover:text-gray-700 transition-colors"
            @click="detectPageType"
          >
            {{ t("common.refresh") }}
          </button>
          <button
            class="text-gray-500 hover:text-gray-700 transition-colors"
            @click="openOptionsPage"
          >
            {{ t("common.settings") }}
          </button>
        </div>
      </main>
    </div>

    <!-- 浮动按钮 -->
    <button
      class="flex w-8 h-8 rounded-full shadow-lg cursor-pointer border-none bg-white hover:bg-gray-100 overflow-hidden"
      @click="toggle()"
    >
      <img :src="iconUrl" class="w-4 h-4 m-auto" alt="Xuan Clipper">
    </button>
  </div>
</template>
