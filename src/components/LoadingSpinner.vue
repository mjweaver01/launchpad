<template>
  <div class="flex justify-center" :class="`my-${my}`">
    <div
      class="rounded-full border-4 border-blue-200 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400 animate-spin"
      :class="`w-${w} h-${w}`"
    ></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'LoadingSpinner',
  props: {
    w: {
      type: Number,
      default: 12,
    },
    h: {
      type: Number,
      default: 12,
    },
    my: {
      type: Number,
      default: 4,
    },
  },
});
</script>
