<template>
  <div class="flex justify-center my-12">
    <div
      class="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"
    ></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'LoadingSpinner',
});
</script>
