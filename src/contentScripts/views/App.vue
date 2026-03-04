<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import "uno.css";

const { t } = useI18n();

// 扩展图标 URL
const iconUrl = browser.runtime.getURL("assets/32x32.png");

// 状态
const show = ref(false);

// 论文元数据
interface PaperCreator {
  firstName: string;
  lastName: string;
  creatorType: string;
}

interface PaperMetadata {
  key: string;
  title: string;
  creators: PaperCreator[];
  publicationTitle?: string;
  date?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  DOI?: string;
  abstractNote?: string;
  url?: string;
}

const paperMetadata = ref<PaperMetadata | null>(null);

// 格式化作者列表
function formatAuthors(creators: PaperCreator[]): string {
  if (!creators || creators.length === 0) return "";
  const names = creators.slice(0, 3).map(c => `${c.firstName} ${c.lastName}`);
  let result = names.join(", ");
  if (creators.length > 3) {
    result += " et al.";
  }
  return result;
}

// 监听论文元数据事件
function handlePaperMetadata(event: CustomEvent<PaperMetadata>) {
  paperMetadata.value = event.detail;
  show.value = true;
}

// 关闭面板
function closePanel() {
  show.value = false;
}

// 打开设置页面
function openOptionsPage() {
  browser.runtime.openOptionsPage();
}

// 组件挂载时检测页面类型并监听事件
onMounted(() => {
  window.addEventListener("xuan-clipper-paper-metadata", handlePaperMetadata as EventListener);
});

onUnmounted(() => {
  window.removeEventListener("xuan-clipper-paper-metadata", handlePaperMetadata as EventListener);
});
</script>

<template>
  <div class="fixed right-0 bottom-0 m-5 z-[2147483647] flex items-end font-sans select-none leading-1em">
    <!-- 论文元数据面板 -->
    <div
      v-show="show && paperMetadata"
      class="w-[320px] bg-white text-gray-700 rounded-lg shadow-lg mr-2 overflow-hidden"
      transition="opacity duration-300"
      :class="show && paperMetadata ? 'opacity-100' : 'opacity-0'"
    >
      <!-- 标题栏 -->
      <div class="flex items-center justify-between px-4 py-3 bg-teal-600 text-white">
        <div class="flex items-center">
          <div class="i-carbon-document text-lg" />
          <span class="ml-2 font-medium text-sm">论文已识别</span>
        </div>
        <button
          class="hover:bg-teal-700 rounded p-1 transition-colors"
          @click="closePanel"
        >
          <div class="i-carbon-close text-lg" />
        </button>
      </div>

      <!-- 元数据内容 -->
      <div class="px-4 py-3 space-y-2 text-sm">
        <!-- 标题 -->
        <div class="font-semibold text-gray-800 leading-tight">
          {{ paperMetadata?.title }}
        </div>

        <!-- 作者 -->
        <div v-if="paperMetadata?.creators?.length" class="text-gray-600 text-xs">
          {{ formatAuthors(paperMetadata.creators) }}
        </div>

        <!-- 期刊信息 -->
        <div v-if="paperMetadata?.publicationTitle" class="text-gray-500 text-xs italic">
          {{ paperMetadata.publicationTitle }}
          <span v-if="paperMetadata.volume || paperMetadata.issue || paperMetadata.pages">
            (
            <span v-if="paperMetadata.volume">{{ paperMetadata.volume }}</span>
            <span v-if="paperMetadata.issue">:{{ paperMetadata.issue }}</span>
            <span v-if="paperMetadata.pages">, {{ paperMetadata.pages }}</span>
            )
          </span>
        </div>

        <!-- 日期 -->
        <div v-if="paperMetadata?.date" class="text-gray-400 text-xs">
          {{ paperMetadata.date }}
        </div>

        <!-- DOI -->
        <div v-if="paperMetadata?.DOI" class="text-xs">
          <span class="text-gray-400">DOI: </span>
          <a
            :href="`https://doi.org/${paperMetadata.DOI}`"
            target="_blank"
            class="text-teal-600 hover:text-teal-700"
          >
            {{ paperMetadata.DOI }}
          </a>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="flex justify-end px-4 py-2 border-t border-gray-100">
        <button
          class="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          @click="openOptionsPage"
        >
          {{ t("common.settings") }}
        </button>
      </div>
    </div>

    <!-- 浮动按钮 -->
    <button
      class="flex w-8 h-8 rounded-full shadow-lg cursor-pointer border-none bg-white hover:bg-gray-100 overflow-hidden"
      @click="show = !show"
    >
      <img :src="iconUrl" class="w-4 h-4 m-auto" alt="Xuan Clipper">
    </button>
  </div>
</template>
