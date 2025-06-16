<template>
  <div
    class="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full mx-auto transition-colors duration-200"
  >
    <div v-if="$route.name !== 'Full Screen'" class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200">Time</h2>
      <div class="flex items-center gap-2">
        <button
          @click="toggleClockType"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center"
          :title="showAnalogClock ? 'Switch to digital' : 'Switch to analog'"
        >
          <svg
            v-if="showAnalogClock"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 2v2m0 16v2m8.66-10H20M4 12H2.34M17.66 6.34L16.24 7.76M7.76 16.24L6.34 17.66M17.66 17.66L16.24 16.24M7.76 7.76L6.34 6.34"
            />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12,6 12,12 16,14"></polyline>
          </svg>
        </button>
        <ExpandWidget widgetName="time" displayName="Time" />
      </div>
    </div>

    <div class="h-full flex flex-col items-center justify-center">
      <!-- Digital Clock -->
      <div v-if="!showAnalogClock" class="text-center">
        <div class="text-4xl sm:text-6xl font-mono font-bold text-gray-800 dark:text-gray-200 mb-2">
          {{ formattedTime }}
        </div>
        <div class="text-lg text-gray-600 dark:text-gray-400 mb-1">
          {{ formattedDate }}
        </div>
        <div
          v-if="locationStore.formattedLocation"
          class="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center justify-center"
        >
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {{ locationStore.formattedLocation }}
        </div>
      </div>

      <!-- Analog Clock -->
      <div v-else class="text-center">
        <div class="relative w-48 h-48 mx-auto mb-4">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <!-- Clock face -->
            <circle
              cx="100"
              cy="100"
              r="98"
              fill="white"
              stroke="currentColor"
              stroke-width="2"
              class="text-gray-300 dark:text-gray-600 dark:fill-gray-700"
            />

            <!-- Hour markers -->
            <g v-for="hour in 12" :key="hour" class="text-gray-400 dark:text-gray-500">
              <line
                :x1="100 + 85 * Math.cos(((hour * 30 - 90) * Math.PI) / 180)"
                :y1="100 + 85 * Math.sin(((hour * 30 - 90) * Math.PI) / 180)"
                :x2="100 + 75 * Math.cos(((hour * 30 - 90) * Math.PI) / 180)"
                :y2="100 + 75 * Math.sin(((hour * 30 - 90) * Math.PI) / 180)"
                stroke="currentColor"
                stroke-width="2"
              />
            </g>

            <!-- Minute markers -->
            <g v-for="minute in 60" :key="minute" class="text-gray-200 dark:text-gray-700">
              <line
                v-if="minute % 5 !== 0"
                :x1="100 + 90 * Math.cos(((minute * 6 - 90) * Math.PI) / 180)"
                :y1="100 + 90 * Math.sin(((minute * 6 - 90) * Math.PI) / 180)"
                :x2="100 + 85 * Math.cos(((minute * 6 - 90) * Math.PI) / 180)"
                :y2="100 + 85 * Math.sin(((minute * 6 - 90) * Math.PI) / 180)"
                stroke="currentColor"
                stroke-width="1"
              />
            </g>

            <!-- Hour hand -->
            <line
              x1="100"
              y1="100"
              :x2="100 + 50 * Math.cos((hourAngle * Math.PI) / 180)"
              :y2="100 + 50 * Math.sin((hourAngle * Math.PI) / 180)"
              stroke="currentColor"
              stroke-width="6"
              stroke-linecap="round"
              class="text-gray-700 dark:text-gray-300"
            />

            <!-- Minute hand -->
            <line
              x1="100"
              y1="100"
              :x2="100 + 70 * Math.cos((minuteAngle * Math.PI) / 180)"
              :y2="100 + 70 * Math.sin((minuteAngle * Math.PI) / 180)"
              stroke="currentColor"
              stroke-width="4"
              stroke-linecap="round"
              class="text-gray-600 dark:text-gray-400"
            />

            <!-- Second hand -->
            <line
              x1="100"
              y1="100"
              :x2="100 + 80 * Math.cos((secondAngle * Math.PI) / 180)"
              :y2="100 + 80 * Math.sin((secondAngle * Math.PI) / 180)"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              class="text-red-500 dark:text-red-400"
            />

            <!-- Center dot -->
            <circle
              cx="100"
              cy="100"
              r="6"
              fill="currentColor"
              class="text-gray-600 dark:text-gray-400"
            />
          </svg>
        </div>

        <div class="text-lg text-gray-600 dark:text-gray-400 mb-1">
          {{ formattedDate }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-500">
          {{ timeZone }}
        </div>
        <div
          v-if="locationStore.formattedLocation"
          class="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center justify-center"
        >
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {{ locationStore.formattedLocation }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, computed, watch } from 'vue';
import ExpandWidget from './ExpandWidget.vue';
import { useLocationStore, useWeatherStore } from '../../stores';

export default defineComponent({
  name: 'TimeWidget',
  components: {
    ExpandWidget,
  },
  setup() {
    const locationStore = useLocationStore();
    const weatherStore = useWeatherStore();
    const currentTime = ref(new Date());
    const showAnalogClock = ref(false);
    let intervalId: number | null = null;

    const formattedTime = computed(() => {
      return currentTime.value.toLocaleTimeString('en-US', {
        hour12: true,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      });
    });

    const formattedDate = computed(() => {
      return currentTime.value.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    const timeZone = computed(() => {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    });

    // Analog clock angles
    const hourAngle = computed(() => {
      const hours = currentTime.value.getHours() % 12;
      const minutes = currentTime.value.getMinutes();
      return hours * 30 + minutes * 0.5 - 90; // -90 to start from 12 o'clock
    });

    const minuteAngle = computed(() => {
      const minutes = currentTime.value.getMinutes();
      const seconds = currentTime.value.getSeconds();
      return minutes * 6 + seconds * 0.1 - 90; // -90 to start from 12 o'clock
    });

    const secondAngle = computed(() => {
      const seconds = currentTime.value.getSeconds();
      return seconds * 6 - 90; // -90 to start from 12 o'clock
    });

    const updateTime = () => {
      currentTime.value = new Date();
    };

    const toggleClockType = () => {
      showAnalogClock.value = !showAnalogClock.value;
      // Save preference to localStorage
      localStorage.setItem('timeWidget-analogClock', JSON.stringify(showAnalogClock.value));
    };

    // Load location data when coordinates are available
    const loadLocationData = async () => {
      const coordinates = weatherStore.coordinatesCache?.data;
      if (coordinates) {
        try {
          await locationStore.loadLocation(coordinates);
        } catch (error) {
          console.warn('Failed to load location data in TimeWidget:', error);
        }
      }
    };

    // Watch for coordinate changes
    watch(
      () => weatherStore.coordinatesCache?.data,
      (newCoords, oldCoords) => {
        if (
          newCoords &&
          (!oldCoords || newCoords.lat !== oldCoords.lat || newCoords.lon !== oldCoords.lon)
        ) {
          loadLocationData();
        }
      },
      { immediate: true }
    );

    onMounted(() => {
      // Initialize stores from storage
      locationStore.initializeFromStorage();
      weatherStore.initializeFromStorage();

      // Load saved preference
      try {
        const saved = localStorage.getItem('timeWidget-analogClock');
        if (saved) {
          showAnalogClock.value = JSON.parse(saved);
        }
      } catch (error) {
        console.warn('Failed to load clock type preference:', error);
      }

      // Update time every second
      intervalId = window.setInterval(updateTime, 1000);
      updateTime(); // Initial update

      // Try to load location data if coordinates are already available
      loadLocationData();
    });

    onUnmounted(() => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    });

    return {
      locationStore,
      currentTime,
      showAnalogClock,
      formattedTime,
      formattedDate,
      timeZone,
      hourAngle,
      minuteAngle,
      secondAngle,
      toggleClockType,
    };
  },
});
</script>
