import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useDarkModeStore = defineStore('darkMode', () => {
  const isDarkMode = ref(false);

  // Initialize from localStorage or system preference
  const initializeDarkMode = () => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      isDarkMode.value = JSON.parse(stored);
    } else {
      // Use system preference if no stored value
      isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    updateDocumentClass();
  };

  // Update the document class based on dark mode state
  const updateDocumentClass = () => {
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode.value));
    updateDocumentClass();
  };

  // Watch for changes and persist to localStorage
  watch(
    isDarkMode,
    newValue => {
      localStorage.setItem('darkMode', JSON.stringify(newValue));
      updateDocumentClass();
    },
    { immediate: false }
  );

  return {
    isDarkMode,
    initializeDarkMode,
    toggleDarkMode,
  };
});
