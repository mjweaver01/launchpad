<template>
  <div class="flex items-center space-x-3">
    <!-- Light Mode Icon -->
    <svg
      class="w-4 h-4 text-yellow-500 transition-opacity duration-200"
      :class="{ 'opacity-50': isDarkMode }"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fill-rule="evenodd"
        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
        clip-rule="evenodd"
      />
    </svg>

    <!-- Toggle Switch -->
    <button
      @click="handleToggle"
      type="button"
      class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800"
      :class="isDarkMode ? 'bg-blue-600' : 'bg-gray-300'"
      role="switch"
      :aria-checked="isDarkMode"
      aria-label="Toggle dark mode"
    >
      <span
        aria-hidden="true"
        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
        :class="isDarkMode ? 'translate-x-5' : 'translate-x-0'"
      ></span>
    </button>

    <!-- Dark Mode Icon -->
    <svg
      class="w-4 h-4 text-gray-300 transition-opacity duration-200"
      :class="{ 'opacity-50': !isDarkMode }"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useDarkModeStore } from '../stores';

export default defineComponent({
  name: 'DarkModeToggle',
  setup() {
    const darkModeStore = useDarkModeStore();
    const isDarkMode = computed(() => darkModeStore.isDarkMode);

    const handleToggle = () => {
      darkModeStore.toggleDarkMode();
    };

    return {
      isDarkMode,
      handleToggle,
    };
  },
});
</script>
