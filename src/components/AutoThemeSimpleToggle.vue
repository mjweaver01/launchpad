<template>
  <div class="flex items-center space-x-3">
    <!-- Manual Mode Icon -->
    <svg
      class="w-4 h-4 text-gray-500 transition-opacity duration-200"
      :class="{ 'opacity-50': autoThemeStore.isAutoThemeEnabled }"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fill-rule="evenodd"
        d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 6a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM14 6a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zM3 14a1 1 0 011-1h2a1 1 0 110 2H4a1 1 0 01-1-1zM8 14a1 1 0 011-1h8a1 1 0 110 2H9a1 1 0 01-1-1z"
        clip-rule="evenodd"
      />
    </svg>

    <!-- Toggle Switch -->
    <button
      @click="handleToggle"
      type="button"
      class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-800"
      :class="autoThemeStore.isAutoThemeEnabled ? 'bg-purple-600' : 'bg-gray-300'"
      role="switch"
      :aria-checked="autoThemeStore.isAutoThemeEnabled"
      aria-label="Toggle auto theme"
    >
      <span
        aria-hidden="true"
        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
        :class="autoThemeStore.isAutoThemeEnabled ? 'translate-x-5' : 'translate-x-0'"
      ></span>
    </button>

    <!-- Auto Mode Icon -->
    <svg
      class="w-4 h-4 text-purple-500 transition-opacity duration-200"
      :class="{ 'opacity-50': !autoThemeStore.isAutoThemeEnabled }"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <!-- Sun half -->
      <path
        d="M12 2V4M12 20V22M4 12H2M6.31 6.31L4.9 4.9M17.69 6.31L19.1 4.9M6.31 17.69L4.9 19.1M17.69 17.69L19.1 19.1M22 12H20"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        fill="none"
        opacity="0.7"
      />
      <!-- Combined sun/moon circle -->
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3" />
      <!-- Moon crescent overlay -->
      <path d="M12 8a4 4 0 0 0 0 8 6 6 0 0 1 0-8z" fill="currentColor" opacity="0.8" />
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useAutoThemeStore } from '../stores/autoTheme';

export default defineComponent({
  name: 'AutoThemeSimpleToggle',
  setup() {
    const autoThemeStore = useAutoThemeStore();

    const handleToggle = () => {
      autoThemeStore.toggleAutoTheme();
    };

    return {
      autoThemeStore,
      handleToggle,
    };
  },
});
</script>
