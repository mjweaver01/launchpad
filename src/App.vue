<template>
  <div class="bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-200">
    <AppHeader v-if="$route.name !== 'Full Screen'" />
    <router-view />
    <div class="red-hue" v-if="redHueStore.isRedHue"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import AppHeader from './components/AppHeader.vue';
import {
  useWeatherStore,
  useNewsStore,
  useDarkModeStore,
  useRedHueStore,
  CacheStorage,
  useCalendarStore,
} from './stores';

export default defineComponent({
  name: 'App',
  components: {
    AppHeader,
  },
  setup() {
    const weatherStore = useWeatherStore();
    const newsStore = useNewsStore();
    const calendarStore = useCalendarStore();
    const darkModeStore = useDarkModeStore();
    const redHueStore = useRedHueStore();
    const refreshInterval = ref<NodeJS.Timeout | null>(null);

    const refreshData = async () => {
      try {
        console.log('Auto-refreshing data...');
        // Refresh weather data
        await weatherStore.refresh();
        // Refresh news data
        await newsStore.refresh();
        // Refresh calendar data
        await calendarStore.refresh();
        console.log('Data refreshed successfully');
      } catch (error) {
        console.error('Error during auto-refresh:', error);
      }
    };

    onMounted(() => {
      // Clean up expired entries first
      CacheStorage.clearExpired();

      // Initialize stores from localStorage
      weatherStore.initializeFromStorage();
      newsStore.initializeFromStorage();
      darkModeStore.initializeDarkMode();
      redHueStore.initializeRedHue();
      calendarStore.initializeFromStorage();

      // Set up auto-refresh every hour (3600000 milliseconds)
      refreshInterval.value = setInterval(() => {
        refreshData();
      }, 3600000); // 1 hour = 60 * 60 * 1000 milliseconds

      console.log('Auto-refresh set up: data will refresh every hour');
    });

    onUnmounted(() => {
      // Clear the interval when component is unmounted
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
        console.log('Auto-refresh cleared');
      }
    });

    return {
      redHueStore,
    };
  },
});
</script>
