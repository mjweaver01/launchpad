<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number;
  }>(),
  { size: 20 }
);
</script>

<template>
  <span
    class="inline-block rounded-full border-2 border-border border-t-brand-600 animate-spin align-[-0.125em]"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="status"
    aria-label="Loading"
  />
</template>
