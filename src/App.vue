<template>
  <div class="bg-gray-100 min-h-screen">
    <AppHeader />
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import AppHeader from './components/AppHeader.vue';
import { useWeatherStore, useNewsStore, CacheStorage } from './stores';

export default defineComponent({
  name: 'App',
  components: {
    AppHeader,
  },
  setup() {
    const weatherStore = useWeatherStore();
    const newsStore = useNewsStore();

    onMounted(() => {
      // Clean up expired entries first
      CacheStorage.clearExpired();

      // Initialize stores from localStorage
      weatherStore.initializeFromStorage();
      newsStore.initializeFromStorage();
    });

    return {};
  },
});
</script>
