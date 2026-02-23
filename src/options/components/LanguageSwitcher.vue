<script setup lang="ts">
import { watch } from "vue";
import { useI18n } from "vue-i18n";
import { setLocale, supportedLocales } from "~/locales";
import { appLocale } from "~/logic/storage";

const { t } = useI18n();

// 同步存储的语言到 i18n
watch(
  appLocale,
  (newLocale) => {
    setLocale(newLocale);
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex items-center gap-2">
    <label
      for="language-selector"
      class="text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ t("common.language") }}
    </label>
    <select
      id="language-selector"
      v-model="appLocale"
      class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option
        v-for="locale in supportedLocales"
        :key="locale.code"
        :value="locale.code"
      >
        {{ locale.name }}
      </option>
    </select>
  </div>
</template>
