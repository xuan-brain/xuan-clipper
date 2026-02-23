<script setup lang="ts">
import type {TabType} from "./components/SettingsSidebar.vue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import AboutSettings from "./components/AboutSettings.vue";
import ClipsSettings from "./components/ClipsSettings.vue";
import PaperSettings from "./components/PaperSettings.vue";
import SettingsSidebar from "./components/SettingsSidebar.vue";

const { t } = useI18n();

const activeTab = ref<TabType>("paper");
</script>

<template>
  <main class="min-h-screen bg-gray-100 dark:bg-gray-900">
    <div class="max-w-5xl mx-auto px-4 py-8">
      <!-- Header -->
      <header class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ t("options.title") }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          {{ t("options.subtitle") }}
        </p>
      </header>

      <!-- Two-column layout -->
      <div class="flex gap-6">
        <!-- Left sidebar -->
        <aside>
          <SettingsSidebar v-model:active-tab="activeTab" />
        </aside>

        <!-- Right content area -->
        <main class="flex-1">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
            <PaperSettings v-if="activeTab === 'paper'" />
            <ClipsSettings v-else-if="activeTab === 'clips'" />
            <AboutSettings v-else-if="activeTab === 'about'" />
          </div>
        </main>
      </div>
    </div>
  </main>
</template>
