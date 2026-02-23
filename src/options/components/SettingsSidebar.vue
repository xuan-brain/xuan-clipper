<script setup lang="ts">
import { useI18n } from "vue-i18n";

export type TabType = "paper" | "clips" | "about";

defineProps<{
  activeTab: TabType;
}>();

const emit = defineEmits<{
  (e: "update:activeTab", value: TabType): void;
}>();

const { t } = useI18n();

const tabs = [
  { id: "paper" as TabType, icon: "i-carbon-document", label: "options.tabs.paper" },
  { id: "clips" as TabType, icon: "i-carbon-document-attachment", label: "options.tabs.clips" },
  { id: "about" as TabType, icon: "i-carbon-information", label: "options.tabs.about" },
];
</script>

<template>
  <nav class="w-56 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors" :class="[
        activeTab === tab.id
          ? 'bg-blue-500 text-white'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
      ]"
      @click="emit('update:activeTab', tab.id)"
    >
      <div :class="tab.icon" class="text-xl" />
      <span class="font-medium">{{ t(tab.label) }}</span>
    </button>
  </nav>
</template>
