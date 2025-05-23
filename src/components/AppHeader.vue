<template>
  <header class="bg-indigo-800 text-white shadow-md">
    <div class="mx-auto px-4 py-3">
      <div class="flex justify-between items-center">
        <router-link to="/" class="font-bold text-xl">🚀 Launchpad</router-link>

        <div class="flex items-center space-x-4">
          <nav class="flex space-x-4">
            <router-link
              v-for="route in routes"
              :key="route.path"
              :to="route.path"
              class="px-3 py-2 rounded hover:bg-indigo-700 transition-colors"
              :class="{ 'bg-indigo-700': $route.path === route.path }"
            >
              {{ route.name }}
            </router-link>
          </nav>

          <!-- Refresh Button -->
          <button
            @click="handleRefresh"
            :disabled="isRefreshing"
            class="flex items-center space-x-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded transition-colors text-sm"
            title="Refresh all data"
          >
            <svg
              :class="['w-4 h-4', isRefreshing ? 'animate-spin' : '']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{{ isRefreshing ? 'Refreshing...' : 'Refresh' }}</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { routes } from '../router';
import { useWeatherStore, useNewsStore } from '../stores';

export default defineComponent({
  name: 'AppHeader',
  setup() {
    const weatherStore = useWeatherStore();
    const newsStore = useNewsStore();
    const isRefreshing = ref(false);

    const handleRefresh = async () => {
      if (isRefreshing.value) return;

      isRefreshing.value = true;
      try {
        await Promise.all([weatherStore.refresh(), newsStore.refresh()]);
      } catch (error) {
        console.error('Failed to refresh data:', error);
      } finally {
        isRefreshing.value = false;
      }
    };

    return {
      routes,
      handleRefresh,
      isRefreshing,
    };
  },
});
</script>
