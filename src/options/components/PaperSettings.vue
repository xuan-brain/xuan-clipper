<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { apiConfig, detectionConfig } from "~/logic/storage";
import SettingItem from "./SettingItem.vue";
import ToggleSwitch from "./ToggleSwitch.vue";

const { t } = useI18n();
</script>

<template>
  <div class="space-y-6">
    <section>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {{ t("options.paper.detection") }}
      </h3>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <SettingItem
          :label="t('options.paper.enableUrlRules')"
          :description="t('options.paper.enableUrlRulesDesc')"
        >
          <ToggleSwitch v-model="detectionConfig.enableUrlRules" />
        </SettingItem>
        <SettingItem
          :label="t('options.paper.enableMetaTags')"
          :description="t('options.paper.enableMetaTagsDesc')"
        >
          <ToggleSwitch v-model="detectionConfig.enableMetaTags" />
        </SettingItem>
        <SettingItem
          :label="t('options.paper.enableJsonLd')"
          :description="t('options.paper.enableJsonLdDesc')"
        >
          <ToggleSwitch v-model="detectionConfig.enableJsonLd" />
        </SettingItem>
      </div>
    </section>

    <section>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {{ t("options.paper.apiConfig") }}
      </h3>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <SettingItem :label="t('options.common.enabled')">
          <ToggleSwitch v-model="apiConfig.enabled" />
        </SettingItem>
        <div class="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <label class="block font-medium text-gray-900 dark:text-gray-100 mb-2">
            {{ t("options.common.endpoint") }}
          </label>
          <input
            v-model="apiConfig.endpoint"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
        </div>
        <div class="px-4 py-4">
          <label class="block font-medium text-gray-900 dark:text-gray-100 mb-2">
            {{ t("options.common.timeout") }}
          </label>
          <input
            v-model.number="apiConfig.timeout"
            type="number"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
        </div>
      </div>
    </section>
  </div>
</template>
