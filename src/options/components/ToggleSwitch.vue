<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();
</script>

<template>
  <button
    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" :class="[
      modelValue ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600',
      disabled && 'opacity-50 cursor-not-allowed',
    ]"
    :disabled="disabled"
    type="button"
    @click="!disabled && emit('update:modelValue', !modelValue)"
  >
    <span
      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="[
        modelValue ? 'translate-x-6' : 'translate-x-1',
      ]"
    />
  </button>
</template>
