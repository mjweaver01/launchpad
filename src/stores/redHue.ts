import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useRedHueStore = defineStore('redHue', () => {
  const isRedHue = ref(false);

  // Initialize from localStorage
  const initializeRedHue = () => {
    const stored = localStorage.getItem('redHue');
    if (stored !== null) {
      isRedHue.value = JSON.parse(stored);
    }
  };

  // Toggle red hue
  const toggleRedHue = () => {
    isRedHue.value = !isRedHue.value;
    localStorage.setItem('redHue', JSON.stringify(isRedHue.value));
  };

  // Watch for changes and persist to localStorage
  watch(
    isRedHue,
    newValue => {
      localStorage.setItem('redHue', JSON.stringify(newValue));
    },
    { immediate: false }
  );

  return {
    isRedHue,
    initializeRedHue,
    toggleRedHue,
  };
});
