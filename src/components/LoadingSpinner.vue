<template>
  <div class="flex justify-center" :class="`my-${my}`">
    <div
      class="rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"
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
  },
});
</script>
