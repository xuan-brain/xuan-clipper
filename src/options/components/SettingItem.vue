<script setup lang="ts">
defineProps<{
  label: string;
  description?: string;
}>();
</script>

<template>
  <div class="flex items-start justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
    <div class="flex-1">
      <div class="font-medium text-gray-900 dark:text-gray-100">
        {{ label }}
      </div>
      <div v-if="description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ description }}
      </div>
    </div>
    <div class="ml-4 flex items-center">
      <slot />
    </div>
  </div>
</template>
