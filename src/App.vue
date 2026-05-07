<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import AppHeader from './components/AppHeader.vue';
import {
  useWeatherStore,
  useNewsStore,
  useDarkModeStore,
  useRedHueStore,
  useAutoThemeStore,
  CacheStorage,
  useCalendarStore,
} from './stores';

const weatherStore = useWeatherStore();
const newsStore = useNewsStore();
const calendarStore = useCalendarStore();
const darkModeStore = useDarkModeStore();
const redHueStore = useRedHueStore();
const autoThemeStore = useAutoThemeStore();
const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null);

const refreshData = async () => {
  try {
    await Promise.all([weatherStore.refresh(), newsStore.refresh(), calendarStore.refresh()]);
  } catch (error) {
    console.error('Error during auto-refresh:', error);
  }
};

onMounted(() => {
  CacheStorage.clearExpired();
  weatherStore.initializeFromStorage();
  newsStore.initializeFromStorage();
  darkModeStore.initializeDarkMode();
  redHueStore.initializeRedHue();
  calendarStore.initializeFromStorage();
  autoThemeStore.initializeAutoTheme();

  refreshInterval.value = setInterval(refreshData, 60 * 60 * 1000);
});

onUnmounted(() => {
  if (refreshInterval.value) clearInterval(refreshInterval.value);
  autoThemeStore.cleanup();
});
</script>

<template>
  <div
    class="min-h-screen bg-[color:var(--color-surface-2)] text-[color:var(--color-fg)] transition-colors duration-200"
  >
    <AppHeader v-if="$route.name !== 'Full Screen'" />
    <router-view />
    <div class="red-hue" v-if="redHueStore.isRedHue"></div>
  </div>
</template>
