<template>
  <div class="space-y-4">
    <!-- Auto Theme Toggle -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <!-- Auto Theme Icon -->
        <svg
          class="w-5 h-5 text-purple-500 transition-opacity duration-200"
          :class="{ 'opacity-50': !autoThemeStore.isAutoThemeEnabled }"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <!-- Sun half -->
          <path
            d="M12 2V4M12 20V22M4 12H2M6.31 6.31L4.9 4.9M17.69 6.31L19.1 4.9M6.31 17.69L4.9 19.1M17.69 17.69L19.1 19.1M22 12H20"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            fill="none"
            opacity="0.7"
          />
          <!-- Combined sun/moon circle -->
          <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3" />
          <!-- Moon crescent overlay -->
          <path d="M12 8a4 4 0 0 0 0 8 6 6 0 0 1 0-8z" fill="currentColor" opacity="0.8" />
        </svg>

        <div>
          <div class="font-medium text-gray-900 dark:text-gray-100">Auto Theme</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ autoThemeStore.isAutoThemeEnabled ? getStatusText() : 'Disabled' }}
          </div>
        </div>
      </div>

      <!-- Toggle Switch -->
      <button
        @click="autoThemeStore.toggleAutoTheme"
        type="button"
        class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-800"
        :class="autoThemeStore.isAutoThemeEnabled ? 'bg-purple-600' : 'bg-gray-300'"
        role="switch"
        :aria-checked="autoThemeStore.isAutoThemeEnabled"
        aria-label="Toggle auto theme"
      >
        <span
          aria-hidden="true"
          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          :class="autoThemeStore.isAutoThemeEnabled ? 'translate-x-5' : 'translate-x-0'"
        ></span>
      </button>
    </div>

    <!-- Current Status -->
    <div
      v-if="autoThemeStore.isAutoThemeEnabled"
      class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm font-medium text-gray-700 dark:text-gray-300">Current Status</div>
        <div class="flex items-center space-x-2">
          <div
            class="w-3 h-3 rounded-full"
            :class="getThemeColor(autoThemeStore.effectiveThemeLevel)"
          ></div>
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
            {{ autoThemeStore.effectiveThemeLevel }}
            {{ autoThemeStore.manualOverride ? '(Manual)' : '(Auto)' }}
          </span>
        </div>
      </div>

      <!-- Theme Schedule -->
      <div class="space-y-2 text-sm">
        <div class="flex justify-between items-center">
          <span class="text-gray-600 dark:text-gray-400">☀️ Normal</span>
          <span class="text-gray-900 dark:text-gray-100">
            {{ formatTime(autoThemeStore.sunTimes.sunrise) }} -
            {{ formatTime(autoThemeStore.sunTimes.sunset) }}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-600 dark:text-gray-400">🌙 Dark</span>
          <span class="text-gray-900 dark:text-gray-100">
            {{ formatTime(autoThemeStore.sunTimes.sunset) }} -
            {{ formatTime(autoThemeStore.redshiftStartHour) }}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-600 dark:text-gray-400">🔴 Redshift</span>
          <span class="text-gray-900 dark:text-gray-100">
            {{ formatTime(autoThemeStore.redshiftStartHour) }} -
            {{ formatTime(autoThemeStore.redshiftEndHour) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Manual Override Controls -->
    <div v-if="autoThemeStore.isAutoThemeEnabled" class="space-y-3">
      <div class="text-sm font-medium text-gray-700 dark:text-gray-300">Manual Override</div>
      <div class="flex space-x-2">
        <button
          v-for="level in themeOptions"
          :key="level"
          @click="toggleManualOverride(level)"
          class="flex-1 px-3 py-2 text-sm rounded-lg border transition-colors"
          :class="[
            autoThemeStore.manualOverride === level
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600',
          ]"
        >
          {{ level === 'normal' ? '☀️' : level === 'dark' ? '🌙' : '🔴' }}
          {{ level.charAt(0).toUpperCase() + level.slice(1) }}
        </button>
      </div>
      <button
        v-if="autoThemeStore.manualOverride"
        @click="autoThemeStore.setManualOverride(null)"
        class="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        Clear Override (Resume Auto)
      </button>
    </div>

    <!-- Settings -->
    <div v-if="autoThemeStore.isAutoThemeEnabled" class="space-y-3">
      <button
        @click="showSettings = !showSettings"
        class="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <span>Redshift Settings</span>
        <svg
          class="w-4 h-4 transform transition-transform"
          :class="{ 'rotate-180': showSettings }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div v-if="showSettings" class="space-y-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Redshift Start Time
          </label>
          <input
            v-model.number="localRedshiftStart"
            @change="updateRedshiftSettings"
            type="range"
            min="18"
            max="23"
            step="0.5"
            class="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>6:00 PM</span>
            <span class="font-medium">{{ formatTime(localRedshiftStart) }}</span>
            <span>11:00 PM</span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Redshift End Time
          </label>
          <input
            v-model.number="localRedshiftEnd"
            @change="updateRedshiftSettings"
            type="range"
            min="4"
            max="10"
            step="0.5"
            class="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>4:00 AM</span>
            <span class="font-medium">{{ formatTime(localRedshiftEnd) }}</span>
            <span>10:00 AM</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue';
import { useAutoThemeStore, type ThemeLevel } from '../stores/autoTheme';

export default defineComponent({
  name: 'AutoThemeToggle',
  setup() {
    const autoThemeStore = useAutoThemeStore();
    const showSettings = ref(false);
    const themeOptions: ThemeLevel[] = ['normal', 'dark', 'redshift'];

    // Local refs for sliders
    const localRedshiftStart = ref(autoThemeStore.redshiftStartHour);
    const localRedshiftEnd = ref(autoThemeStore.redshiftEndHour);

    // Watch for changes from the store
    watch(
      () => autoThemeStore.redshiftStartHour,
      newVal => {
        localRedshiftStart.value = newVal;
      }
    );

    watch(
      () => autoThemeStore.redshiftEndHour,
      newVal => {
        localRedshiftEnd.value = newVal;
      }
    );

    const formatTime = (hour: number): string => {
      const wholeHour = Math.floor(hour);
      const minutes = Math.round((hour - wholeHour) * 60);
      const period = wholeHour >= 12 ? 'PM' : 'AM';
      const displayHour = wholeHour > 12 ? wholeHour - 12 : wholeHour === 0 ? 12 : wholeHour;
      return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const getThemeColor = (level: ThemeLevel): string => {
      switch (level) {
        case 'normal':
          return 'bg-yellow-400';
        case 'dark':
          return 'bg-blue-600';
        case 'redshift':
          return 'bg-red-600';
        default:
          return 'bg-gray-400';
      }
    };

    const getStatusText = (): string => {
      const currentTime = new Date();
      const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;

      if (autoThemeStore.manualOverride) {
        return `Manual: ${autoThemeStore.manualOverride}`;
      }

      return `Auto: ${autoThemeStore.currentThemeLevel}`;
    };

    const toggleManualOverride = (level: ThemeLevel) => {
      if (autoThemeStore.manualOverride === level) {
        autoThemeStore.setManualOverride(null);
      } else {
        autoThemeStore.setManualOverride(level);
      }
    };

    const updateRedshiftSettings = () => {
      autoThemeStore.updateRedshiftTimes(localRedshiftStart.value, localRedshiftEnd.value);
    };

    return {
      autoThemeStore,
      showSettings,
      themeOptions,
      localRedshiftStart,
      localRedshiftEnd,
      formatTime,
      getThemeColor,
      getStatusText,
      toggleManualOverride,
      updateRedshiftSettings,
    };
  },
});
</script>

<style scoped>
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #7c3aed;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #7c3aed;
  cursor: pointer;
  border: none;
}

/* Dark mode slider styles */
.dark .slider::-webkit-slider-thumb {
  background: #8b5cf6;
}

.dark .slider::-moz-range-thumb {
  background: #8b5cf6;
}
</style>
