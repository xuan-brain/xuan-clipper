<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { clipsApiConfig } from "~/logic/storage";
import SettingItem from "./SettingItem.vue";
import ToggleSwitch from "./ToggleSwitch.vue";

const { t } = useI18n();
</script>

<template>
  <div class="space-y-6">
    <section>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {{ t("options.clips.apiConfig") }}
      </h3>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <SettingItem :label="t('options.common.enabled')">
          <ToggleSwitch v-model="clipsApiConfig.enabled" />
        </SettingItem>
        <div class="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <label class="block font-medium text-gray-900 dark:text-gray-100 mb-2">
            {{ t("options.common.endpoint") }}
          </label>
          <input
            v-model="clipsApiConfig.endpoint"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
        </div>
        <div class="px-4 py-4">
          <label class="block font-medium text-gray-900 dark:text-gray-100 mb-2">
            {{ t("options.common.timeout") }}
          </label>
          <input
            v-model.number="clipsApiConfig.timeout"
            type="number"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
        </div>
      </div>
    </section>

    <section>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {{ t("options.clips.metadata") }}
      </h3>
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
        {{ t("options.clips.metadataDesc") }}
      </div>
    </section>
  </div>
</template>
