<script setup lang="ts">
import type {
  ExportMarkdownResponse,
  ImportPaperResponse,
  PageTypeResponse,
} from "~/logic/messaging";
import type { DetectionResult } from "~/logic/page-detector";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { sendMessage } from "webext-bridge/popup";
import { MESSAGE_TYPES } from "~/logic/messaging";

const { t } = useI18n();

// 状态
const loading = ref(true);
const error = ref<string>();
const pageTypeResult = ref<DetectionResult | null>(null);

// 检测页面类型
async function detectPageType() {
  loading.value = true;
  error.value = undefined;

  try {
    const response = await sendMessage<PageTypeResponse>(
      MESSAGE_TYPES.GET_PAGE_TYPE,
      {},
      { context: "background" },
    );

    if (response.success) {
      pageTypeResult.value = response.result ?? null;
    } else {
      error.value = response.error;
      // 如果有默认结果，使用它
      pageTypeResult.value = response.result ?? null;
    }
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
    const response = await sendMessage<ImportPaperResponse>(
      MESSAGE_TYPES.IMPORT_PAPER,
      {},
      { context: "background" },
    );

    if (!response.success) {
      console.error("Import paper failed:", response.error);
    }
  } catch (e) {
    console.error("Import paper failed:", e);
  }
  // 操作完成后关闭弹窗
  window.close();
}

// 处理导出 Markdown 操作
async function handleExportMarkdown() {
  try {
    const response = await sendMessage<ExportMarkdownResponse>(
      MESSAGE_TYPES.EXPORT_MARKDOWN,
      {},
      { context: "background" },
    );

    if (!response.success) {
      console.error("Export markdown failed:", response.error);
    }
  } catch (e) {
    console.error("Export markdown failed:", e);
  }
  // 操作完成后关闭弹窗
  window.close();
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
  <main class="w-[320px] px-4 py-4 text-gray-700">
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
        <button
          class="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
          @click="handleExportMarkdown"
        >
          <div class="i-carbon-download mr-2" />
          {{ t("popup.exportMarkdown") }}
        </button>
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
</template>
