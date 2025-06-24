<template>
  <header class="bg-blue-800 dark:bg-gray-700 text-white shadow-md transition-colors duration-200">
    <div class="mx-auto px-4 sm:px-6 py-2.5">
      <div class="flex justify-between items-center">
        <router-link to="/" class="uppercase tracking-[2px] text-2xl font-bold"
          >🚀 <span class="hidden sm:inline">Launchpad</span></router-link
        >

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-4">
          <nav class="flex space-x-4">
            <router-link
              v-for="route in filteredRoutes"
              :key="route.path"
              :to="route.path"
              class="px-3 py-2 rounded hover:bg-blue-700 dark:hover:bg-gray-600 transition-colors leading-[20px]"
              :class="{ 'bg-blue-700 dark:bg-gray-700': $route.path === route.path }"
            >
              {{ route.name }}
            </router-link>
            <router-link
              v-if="showHomeLink"
              to="/"
              class="px-3 py-2 rounded hover:bg-blue-700 dark:hover:bg-gray-600 transition-colors leading-[20px]"
              >Home</router-link
            >
          </nav>

          <!-- Theme Toggles -->
          <div class="flex items-center space-x-4">
            <DarkModeToggle />
            <RedHueToggle />
            <AutoThemeSimpleToggle />
          </div>

          <!-- Refresh Button -->
          <button
            @click="handleRefresh"
            :disabled="isRefreshing"
            class="flex items-center space-x-1 px-3 py-2 bg-blue-600 dark:bg-gray-800 hover:bg-blue-700 dark:hover:bg-gray-700 disabled:bg-blue-400 dark:disabled:bg-gray-600 rounded transition-colors text-sm"
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

        <!-- Mobile Menu Button and Controls -->
        <div class="md:hidden flex items-center space-x-2">
          <!-- Theme Toggles (Mobile) -->
          <div class="flex items-center space-x-2">
            <DarkModeToggle />
            <RedHueToggle />
          </div>

          <!-- Refresh Button (Mobile) -->
          <button
            @click="handleRefresh"
            :disabled="isRefreshing"
            class="flex items-center justify-center p-2 bg-blue-600 dark:bg-gray-800 hover:bg-blue-700 dark:hover:bg-gray-700 disabled:bg-blue-400 dark:disabled:bg-gray-600 rounded transition-colors"
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
          </button>

          <!-- Hamburger Menu Button -->
          <button
            v-if="hasNavItems"
            @click="toggleMobileMenu"
            class="p-2 rounded hover:bg-blue-700 dark:hover:bg-gray-600 transition-colors"
            :aria-expanded="isMobileMenuOpen"
            aria-label="Toggle navigation menu"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                v-if="!isMobileMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div
        v-if="isMobileMenuOpen && hasNavItems"
        class="md:hidden mt-4 pb-4 border-t border-blue-700 dark:border-gray-600"
      >
        <nav class="flex flex-col space-y-2 mt-4">
          <router-link
            v-for="route in filteredRoutes"
            :key="route.path"
            :to="route.path"
            @click="closeMobileMenu"
            class="px-3 py-2 rounded hover:bg-blue-700 dark:hover:bg-gray-600 transition-colors"
            :class="{ 'bg-blue-700 dark:bg-gray-700': $route.path === route.path }"
          >
            {{ route.name }}
          </router-link>
          <router-link
            v-if="showHomeLink"
            to="/"
            @click="closeMobileMenu"
            class="px-3 py-2 rounded hover:bg-blue-700 dark:hover:bg-gray-600 transition-colors"
            >Home</router-link
          >
        </nav>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { routes } from '../router';
import { useWeatherStore, useNewsStore, useCalendarStore } from '../stores';
import DarkModeToggle from './DarkModeToggle.vue';
import RedHueToggle from './RedHueToggle.vue';
import AutoThemeSimpleToggle from './AutoThemeSimpleToggle.vue';

export default defineComponent({
  name: 'AppHeader',
  components: {
    DarkModeToggle,
    RedHueToggle,
    AutoThemeSimpleToggle,
  },
  setup() {
    const route = useRoute();
    const weatherStore = useWeatherStore();
    const newsStore = useNewsStore();
    const calendarStore = useCalendarStore();
    const isRefreshing = ref(false);
    const isMobileMenuOpen = ref(false);

    // Computed properties to avoid duplication
    const filteredRoutes = computed(() => {
      return routes.filter(
        route =>
          !route.path.includes('google') && route.path !== '/' && !route.path.includes('/widget')
      );
    });

    const showHomeLink = computed(() => {
      return route.path.includes('/widget');
    });

    const handleRefresh = async () => {
      if (isRefreshing.value) return;

      isRefreshing.value = true;
      try {
        await Promise.all([weatherStore.refresh(), newsStore.refresh(), calendarStore.refresh()]);
      } catch (error) {
        console.error('Failed to refresh data:', error);
      } finally {
        isRefreshing.value = false;
      }
    };

    const toggleMobileMenu = () => {
      isMobileMenuOpen.value = !isMobileMenuOpen.value;
    };

    const closeMobileMenu = () => {
      isMobileMenuOpen.value = false;
    };

    const hasNavItems = computed(() => {
      return filteredRoutes.value.length > 0 || showHomeLink.value;
    });

    return {
      filteredRoutes,
      showHomeLink,
      handleRefresh,
      isRefreshing,
      isMobileMenuOpen,
      toggleMobileMenu,
      closeMobileMenu,
      hasNavItems,
    };
  },
});
</script>

<style scoped>
header {
  position: sticky;
  top: 0;
  z-index: 100;
}
</style>
