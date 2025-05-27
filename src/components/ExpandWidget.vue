<template>
  <router-link
    v-if="!route.path.includes('widget')"
    :to="`/widget/${widgetName}`"
    class="p-2 text-gray-600 hover:text-blue-600 transition-colors flex items-center justify-center"
    :title="`View ${displayName} in full page`"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
      />
    </svg>
  </router-link>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRoute } from 'vue-router';

export default defineComponent({
  name: 'ExpandWidget',
  props: {
    widgetName: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
  },
  setup() {
    const route = useRoute();
    return {
      route,
    };
  },
});
</script>
