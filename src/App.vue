<template>
  <div class="bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-200">
    <AppHeader />
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import AppHeader from './components/AppHeader.vue';
import { useWeatherStore, useNewsStore, useDarkModeStore, CacheStorage } from './stores';

export default defineComponent({
  name: 'App',
  components: {
    AppHeader,
  },
  setup() {
    const weatherStore = useWeatherStore();
    const newsStore = useNewsStore();
    const darkModeStore = useDarkModeStore();

    onMounted(() => {
      // Clean up expired entries first
      CacheStorage.clearExpired();

      // Initialize stores from localStorage
      weatherStore.initializeFromStorage();
      newsStore.initializeFromStorage();
      darkModeStore.initializeDarkMode();
    });

    return {};
  },
});
</script>
