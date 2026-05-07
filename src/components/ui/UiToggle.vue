<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  modelValue: boolean;
  label?: string;
  description?: string;
  iconOff?: Component;
  iconOn?: Component;
}>();

defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
}>();
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <div v-if="label || $slots.default" class="flex items-center gap-3 min-w-0">
      <component
        :is="iconOff"
        v-if="iconOff && !modelValue"
        class="w-4 h-4 text-[color:var(--color-fg-muted)] flex-shrink-0"
      />
      <component
        :is="iconOn"
        v-if="iconOn && modelValue"
        class="w-4 h-4 text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)] flex-shrink-0"
      />
      <div class="min-w-0">
        <div class="text-sm font-medium text-[color:var(--color-fg)] truncate">
          {{ label }}<slot />
        </div>
        <div v-if="description" class="text-xs text-[color:var(--color-fg-muted)] truncate">
          {{ description }}
        </div>
      </div>
    </div>
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-label="label"
      class="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-out border border-transparent"
      :class="
        modelValue
          ? 'bg-[color:var(--color-brand-600)]'
          : 'bg-[color:var(--color-border-strong)]'
      "
      @click="$emit('update:modelValue', !modelValue)"
    >
      <span
        aria-hidden="true"
        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-out"
        :class="modelValue ? 'translate-x-5' : 'translate-x-0.5'"
      ></span>
    </button>
  </div>
</template>
