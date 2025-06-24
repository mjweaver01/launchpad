<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Configure your theme preferences and automatic scheduling
        </p>
      </div>

      <!-- Current Theme Status -->
      <div
        v-if="autoThemeStore.isAutoThemeEnabled"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6"
      >
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Current Theme Status
        </h2>
        <div class="flex items-center space-x-4">
          <div class="w-4 h-4 rounded-full" :class="getCurrentThemeColor"></div>
          <div>
            <div class="font-medium text-gray-900 dark:text-gray-100">
              {{ getCurrentThemeLabel }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ getCurrentThemeDescription }}
            </div>
          </div>
        </div>
      </div>

      <!-- Manual Theme Controls -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Manual Theme Controls
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Override the automatic theme system or use these controls when auto-theme is disabled.
        </p>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium text-gray-900 dark:text-gray-100">Dark Mode</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Enable dark theme
                <span
                  v-if="autoThemeStore.isAutoThemeEnabled && !autoThemeStore.manualOverride"
                  class="text-orange-600 dark:text-orange-400"
                  >(Auto-theme will override this)</span
                >
              </p>
            </div>
            <DarkModeToggle />
          </div>

          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium text-gray-900 dark:text-gray-100">Red Shift</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Apply red color filter for night viewing
                <span
                  v-if="autoThemeStore.isAutoThemeEnabled && !autoThemeStore.manualOverride"
                  class="text-orange-600 dark:text-orange-400"
                  >(Auto-theme will override this)</span
                >
              </p>
            </div>
            <RedHueToggle />
          </div>
        </div>
      </div>

      <!-- Auto Theme Settings -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Auto Theme</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Automatically switch between normal, dark, and red shift modes based on time of day and
          your location.
        </p>
        <AutoThemeToggle />
      </div>

      <!-- Theme Information -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          About Theme Levels
        </h2>
        <div class="space-y-4">
          <div class="flex items-start space-x-3">
            <div class="w-3 h-3 bg-yellow-400 rounded-full mt-2"></div>
            <div>
              <h3 class="font-medium text-gray-900 dark:text-gray-100">☀️ Normal Mode</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Light theme used during daytime hours (sunrise to sunset). Provides optimal
                visibility and contrast for most activities.
              </p>
            </div>
          </div>

          <div class="flex items-start space-x-3">
            <div class="w-3 h-3 bg-blue-600 rounded-full mt-2"></div>
            <div>
              <h3 class="font-medium text-gray-900 dark:text-gray-100">🌙 Dark Mode</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Dark theme used during evening hours (sunset to bedtime). Reduces eye strain in
                low-light environments.
              </p>
            </div>
          </div>

          <div class="flex items-start space-x-3">
            <div class="w-3 h-3 bg-red-600 rounded-full mt-2"></div>
            <div>
              <h3 class="font-medium text-gray-900 dark:text-gray-100">🔴 Red Shift Mode</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Dark theme with red color filter for late night hours. Reduces blue light exposure
                to help maintain natural sleep cycles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, watch, ref, onMounted, onUnmounted } from 'vue';
import { useAutoThemeStore, type ThemeLevel } from '../stores/autoTheme';
import { useDarkModeStore } from '../stores/darkMode';
import { useRedHueStore } from '../stores/redHue';
import AutoThemeToggle from '../components/AutoThemeToggle.vue';
import DarkModeToggle from '../components/DarkModeToggle.vue';
import RedHueToggle from '../components/RedHueToggle.vue';

export default defineComponent({
  name: 'Settings',
  components: {
    AutoThemeToggle,
    DarkModeToggle,
    RedHueToggle,
  },
  setup() {
    const autoThemeStore = useAutoThemeStore();
    const darkModeStore = useDarkModeStore();
    const redHueStore = useRedHueStore();

    // Force reactivity by creating a ref that updates
    const lastUpdate = ref(Date.now());
    let updateInterval: number | null = null;

    // Computed properties for current theme status
    const getCurrentThemeColor = computed(() => {
      // Force re-computation by accessing lastUpdate
      lastUpdate.value;

      switch (autoThemeStore.effectiveThemeLevel) {
        case 'normal':
          return 'bg-yellow-400';
        case 'dark':
          return 'bg-blue-600';
        case 'redshift':
          return 'bg-red-600';
        default:
          return 'bg-gray-400';
      }
    });

    const getCurrentThemeLabel = computed(() => {
      // Force re-computation by accessing lastUpdate
      lastUpdate.value;

      const level = autoThemeStore.effectiveThemeLevel;
      const isManual = autoThemeStore.manualOverride !== null;
      const emoji = level === 'normal' ? '☀️' : level === 'dark' ? '🌙' : '🔴';
      const mode = isManual ? 'Manual' : 'Auto';

      return `${emoji} ${level.charAt(0).toUpperCase() + level.slice(1)} (${mode})`;
    });

    const getCurrentThemeDescription = computed(() => {
      // Force re-computation by accessing lastUpdate
      lastUpdate.value;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (autoThemeStore.manualOverride) {
        return `Manually set to ${autoThemeStore.manualOverride} mode at ${timeStr}`;
      }

      return `Automatically set to ${autoThemeStore.currentThemeLevel} mode at ${timeStr}`;
    });

    // Watch for theme changes and force UI updates
    watch(
      () => [
        autoThemeStore.effectiveThemeLevel,
        autoThemeStore.manualOverride,
        autoThemeStore.currentThemeLevel,
        autoThemeStore.isAutoThemeEnabled,
        darkModeStore.isDarkMode,
        redHueStore.isRedHue,
      ],
      () => {
        lastUpdate.value = Date.now();
      },
      { deep: true }
    );

    onMounted(() => {
      // Update every 30 seconds to keep the UI fresh
      updateInterval = setInterval(() => {
        lastUpdate.value = Date.now();
      }, 30000);
    });

    onUnmounted(() => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    });

    return {
      autoThemeStore,
      darkModeStore,
      redHueStore,
      getCurrentThemeColor,
      getCurrentThemeLabel,
      getCurrentThemeDescription,
    };
  },
});
</script>
