<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  icon?: Component;
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="text-center py-10">
    <div
      v-if="icon"
      class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-muted)]"
    >
      <component :is="icon" class="h-6 w-6" />
    </div>
    <h3 class="text-sm font-semibold text-[color:var(--color-fg)] mb-1">{{ title }}</h3>
    <p
      v-if="description"
      class="text-sm text-[color:var(--color-fg-muted)] max-w-sm mx-auto leading-relaxed"
    >
      {{ description }}
    </p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>
