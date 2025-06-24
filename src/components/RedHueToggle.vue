<template>
  <div class="flex items-center space-x-3">
    <!-- Normal Mode Icon -->
    <svg
      class="w-4 h-4 text-gray-500 transition-opacity duration-200"
      :class="{ 'opacity-50': isRedHue }"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fill-rule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clip-rule="evenodd"
      />
    </svg>

    <!-- Toggle Switch -->
    <button
      @click="handleToggle"
      type="button"
      class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-800"
      :class="isRedHue ? 'bg-red-600' : 'bg-gray-300'"
      role="switch"
      :aria-checked="isRedHue"
      aria-label="Toggle red hue"
    >
      <span
        aria-hidden="true"
        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
        :class="isRedHue ? 'translate-x-5' : 'translate-x-0'"
      ></span>
    </button>

    <!-- Red Hue Icon -->
    <svg
      class="w-4 h-4 text-red-500 transition-opacity duration-200"
      :class="{ 'opacity-50': !isRedHue }"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fill-rule="evenodd"
        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
        clip-rule="evenodd"
      />
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useRedHueStore } from '../stores/redHue';

export default defineComponent({
  name: 'RedHueToggle',
  setup() {
    const redHueStore = useRedHueStore();
    const isRedHue = computed(() => redHueStore.isRedHue);

    const handleToggle = () => {
      redHueStore.toggleRedHue();
    };

    return {
      isRedHue,
      handleToggle,
    };
  },
});
</script>
