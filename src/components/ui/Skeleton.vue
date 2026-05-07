<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string;
    height?: string;
    rounded?: string;
  }>(),
  {
    width: '100%',
    height: '1rem',
    rounded: '0.5rem',
  }
);
</script>

<template>
  <div class="ui-skeleton" :style="{ width, height, borderRadius: rounded }" />
</template>
