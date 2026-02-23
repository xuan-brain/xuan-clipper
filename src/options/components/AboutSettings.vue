<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import logo from "~/assets/32x32.png";

const { t } = useI18n();

const version = ref("1.0.0");

// Get actual version from manifest
browser.runtime.getManifest().then((manifest) => {
  version.value = manifest.version;
});
</script>

<template>
  <div class="space-y-6">
    <section class="text-center py-8">
      <img :src="logo" class="w-16 h-16 mx-auto mb-4" alt="Xuan Clipper">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Xuan Clipper
      </h2>
      <p class="text-gray-500 dark:text-gray-400 mt-2">
        v{{ version }}
      </p>
    </section>

    <section class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">
          {{ t("options.about.description") }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {{ t("options.about.descriptionText") }}
        </p>
      </div>
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">
          {{ t("options.about.features") }}
        </h3>
        <ul class="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
          <li>• {{ t("options.about.feature1") }}</li>
          <li>• {{ t("options.about.feature2") }}</li>
          <li>• {{ t("options.about.feature3") }}</li>
        </ul>
      </div>
      <div class="p-4">
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">
          {{ t("options.about.links") }}
        </h3>
        <div class="flex gap-4 mt-3">
          <a
            href="https://github.com/yourusername/xuan-clipper"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-500 hover:text-blue-600"
          >
            GitHub
          </a>
          <a
            href="https://github.com/yourusername/xuan-clipper/issues"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-500 hover:text-blue-600"
          >
            {{ t("options.about.reportIssue") }}
          </a>
        </div>
      </div>
    </section>
  </div>
</template>
