<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'default' | 'success' | 'warning' | 'brand';
  }>(),
  { variant: 'default' }
);
</script>

<template>
  <span class="ui-pill" :class="`ui-pill-${variant}`">
    <slot />
  </span>
</template>
