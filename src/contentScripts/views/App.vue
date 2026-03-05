<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import Treeselect from "vue3-treeselect";
import { useI18n } from "vue-i18n";
import "vue3-treeselect/dist/vue3-treeselect.css";
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

// 分类树节点
interface CategoryNode {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  children: CategoryNode[];
}

// Treeselect 节点格式
interface TreeselectNode {
  id: string;
  label: string;
  children?: TreeselectNode[];
}

const paperMetadata = ref<PaperMetadata | null>(null);
const categories = ref<TreeselectNode[]>([]);
const selectedCategoryId = ref<string | null>(null);
const isLoadingCategories = ref(false);
const isImporting = ref(false);
// Treeselect 组件引用
const treeselectRef = ref<InstanceType<typeof Treeselect> | null>(null);

// API 基础地址
const API_BASE = "http://127.0.0.1:3030/api";

// 转换 API 分类数据为 Treeselect 格式
function transformCategories(nodes: CategoryNode[]): TreeselectNode[] {
  return nodes.map((node) => {
    const transformed: TreeselectNode = {
      id: String(node.id), // 确保id是字符串
      label: node.name,
      children: node.children?.length
        ? transformCategories(node.children)
        : undefined,
    };
    return transformed;
  });
}

// 获取分类树
async function fetchCategories() {
  isLoadingCategories.value = true;
  try {
    const response = await fetch(`${API_BASE}/categories/tree`);
    if (response.ok) {
      const data: CategoryNode[] = await response.json();
      console.log("[xuan-clipper] 获取分类树 API 原始返回:", data);
      categories.value = transformCategories(data);
      console.log("[xuan-clipper] 转换后的分类树:", categories.value);
      // 打印所有可用的 id
      const allIds: string[] = [];
      function collectIds(nodes: TreeselectNode[]) {
        for (const node of nodes) {
          allIds.push(String(node.id));
          if (node.children) {
            collectIds(node.children);
          }
        }
      }
      collectIds(categories.value);
      console.log("[xuan-clipper] 所有可用的分类 ID:", allIds);
    }
  } catch (error) {
    console.error("Failed to fetch categories:", error);
  } finally {
    isLoadingCategories.value = false;
  }
}

// 获取当前选中的分类
async function fetchSelectedCategory() {
  try {
    const response = await fetch(`${API_BASE}/categories/selected`);
    if (response.ok) {
      const data = await response.json();
      console.log("[xuan-clipper] 获取选中分类 API 返回:", data);
      console.log(
        "[xuan-clipper] selected_category_id 类型:",
        typeof data.selected_category_id,
      );
      // 确保类型一致：将 id 转换为字符串
      if (
        data.selected_category_id !== null &&
        data.selected_category_id !== undefined
      ) {
        const idStr = String(data.selected_category_id);
        console.log(
          "[xuan-clipper] 转换后的 selectedCategoryId:",
          idStr,
          "类型:",
          typeof idStr,
        );

        // 使用组件的 select() 和 getNode() 方法来设置选中值
        await nextTick();
        if (treeselectRef.value) {
          const node = treeselectRef.value.getNode(idStr);
          console.log("[xuan-clipper] getNode 返回:", node);
          if (node) {
            treeselectRef.value.select(node);
            console.log("[xuan-clipper] 通过 select() 设置选中节点成功");
          } else {
            // 如果 getNode 找不到，回退到直接设置 v-model
            selectedCategoryId.value = idStr;
            console.log(
              "[xuan-clipper] getNode 返回 null，回退到直接设置 v-model",
            );
          }
        } else {
          // 如果组件引用不存在，回退到直接设置 v-model
          selectedCategoryId.value = idStr;
          console.log("[xuan-clipper] 组件引用不存在，回退到直接设置 v-model");
        }
        console.log(
          "[xuan-clipper] 设置后 selectedCategoryId.value:",
          selectedCategoryId.value,
        );
      }
    }
  } catch (error) {
    console.error("Failed to fetch selected category:", error);
  }
}

// 格式化作者列表
function formatAuthors(creators: PaperCreator[]): string {
  if (!creators || creators.length === 0) return "";
  const names = creators.slice(0, 3).map((c) => `${c.firstName} ${c.lastName}`);
  let result = names.join(", ");
  if (creators.length > 3) {
    result += " et al.";
  }
  return result;
}

// 监听论文元数据事件
async function handlePaperMetadata(event: CustomEvent<PaperMetadata>) {
  paperMetadata.value = event.detail;
  show.value = true;
  // 先加载分类树，再设置选中分类（确保顺序正确）
  await fetchCategories();
  await fetchSelectedCategory();
}

// 关闭面板
function closePanel() {
  show.value = false;
}

// 导入论文
async function importPaper() {
  if (!paperMetadata.value || isImporting.value) return;

  isImporting.value = true;
  try {
    // TODO: 调用实际的导入 API
    console.log("Importing paper with category:", selectedCategoryId.value);
    console.log("Paper metadata:", paperMetadata.value);

    // 这里可以添加实际的 API 调用
    // const response = await fetch(`${API_BASE}/papers/import`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     ...paperMetadata.value,
    //     category_id: selectedCategoryId.value
    //   })
    // });

    // 暂时模拟成功
    console.log(t("notifications.importSuccess"));
    closePanel();
  } catch (error) {
    console.error("Failed to import paper:", error);
    console.error(t("notifications.importFailed"));
  } finally {
    isImporting.value = false;
  }
}

// 组件挂载时检测页面类型并监听事件
onMounted(() => {
  window.addEventListener(
    "xuan-clipper-paper-metadata",
    handlePaperMetadata as EventListener,
  );
});

onUnmounted(() => {
  window.removeEventListener(
    "xuan-clipper-paper-metadata",
    handlePaperMetadata as EventListener,
  );
});
</script>

<template>
  <div
    class="fixed right-0 bottom-0 m-5 z-[2147483647] flex items-end font-sans select-none leading-1em"
  >
    <!-- 论文元数据面板 -->
    <div
      v-show="show && paperMetadata"
      class="w-[320px] bg-white text-gray-700 rounded-lg shadow-lg mr-2 overflow-hidden"
      transition="opacity duration-300"
      :class="show && paperMetadata ? 'opacity-100' : 'opacity-0'"
    >
      <!-- 标题栏 -->
      <div
        class="flex items-center justify-between px-4 py-3 bg-teal-600 text-white"
      >
        <div class="flex items-center">
          <div class="i-carbon-document text-lg" />
          <span class="ml-2 font-medium text-sm">{{
            t("metadataPanel.paperDetected")
          }}</span>
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
        <div
          v-if="paperMetadata?.creators?.length"
          class="text-gray-600 text-xs"
        >
          {{ formatAuthors(paperMetadata.creators) }}
        </div>

        <!-- 期刊信息 -->
        <div
          v-if="paperMetadata?.publicationTitle"
          class="text-gray-500 text-xs italic"
        >
          {{ paperMetadata.publicationTitle }}
          <span
            v-if="
              paperMetadata.volume || paperMetadata.issue || paperMetadata.pages
            "
          >
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
          <span class="text-gray-400">{{ t("metadataPanel.doi") }}: </span>
          <a
            :href="`https://doi.org/${paperMetadata.DOI}`"
            target="_blank"
            class="text-teal-600 hover:text-teal-700"
          >
            {{ paperMetadata.DOI }}
          </a>
        </div>
      </div>

      <!-- 导入区域 -->
      <div class="px-4 py-3 border-t border-gray-100">
        <div class="flex items-center gap-2">
          <!-- 分类选择器 -->
          <div class="flex-1 min-w-0">
            <Treeselect
              ref="treeselectRef"
              v-model="selectedCategoryId"
              :options="categories"
              :placeholder="t('metadataPanel.selectCategoryPlaceholder')"
              :disabled="isLoadingCategories"
              :clearable="true"
              :searchable="true"
              :default-expand-level="Infinity"
              :no-results-text="t('metadataPanel.noResults')"
              :no-options-text="t('metadataPanel.noOptions')"
              :loading-text="t('metadataPanel.loading')"
              class="treeselect-custom"
            />
          </div>

          <!-- 导入按钮 -->
          <button
            class="shrink-0 py-1.5 px-2.5 bg-teal-600 text-white text-xs font-medium rounded hover:bg-teal-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            :disabled="isImporting"
            @click="importPaper"
          >
            <div v-if="isImporting" class="i-carbon-restart animate-spin" />
            <div v-else class="i-carbon-import" />
            <span class="hidden sm:inline">{{
              isImporting
                ? t("metadataPanel.importing")
                : t("metadataPanel.import")
            }}</span>
          </button>
        </div>
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

<style>
/* 自定义 Treeselect 样式以适应小面板 */
.treeselect-custom .vue-treeselect {
  font-size: 11px;
}

.treeselect-custom .vue-treeselect__control {
  min-height: 28px;
  border-radius: 4px;
  border-color: #d1d5db;
}

.treeselect-custom .vue-treeselect__control:hover {
  border-color: #9ca3af;
}

.treeselect-custom .vue-treeselect__menu {
  border-radius: 4px;
  font-size: 11px;
}

.treeselect-custom .vue-treeselect__option {
  padding: 4px 8px;
}

/* 确保下拉菜单在面板上方 */
.vue-treeselect__menu-container {
  z-index: 2147483647 !important;
}
</style>
