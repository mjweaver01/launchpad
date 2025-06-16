<template>
  <div
    class="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full mx-auto transition-colors duration-200"
  >
    <div v-if="$route.name !== 'Full Screen'" class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200">Current Weather</h2>
      <div class="flex items-center gap-2">
        <button
          @click="loadWeather(true)"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center"
          :disabled="weatherStore.loading"
        >
          <svg
            class="w-4 h-4"
            :class="{ 'animate-spin': weatherStore.loading }"
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
        <ExpandWidget widgetName="weather" displayName="Weather" />
      </div>
    </div>

    <div class="h-full overflow-y-auto">
      <!-- Loading state -->
      <div v-if="weatherStore.loading" class="text-center">
        <LoadingSpinner />
        <p class="text-gray-600 dark:text-gray-400 mt-2">Getting your location...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="weatherStore.error" class="text-center">
        <div class="text-red-500 dark:text-red-400 mb-2">
          <svg class="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <p class="text-red-600 dark:text-red-400 text-sm">{{ weatherStore.error }}</p>
        <button
          @click="retryLocation"
          class="mt-3 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
        >
          Try Again
        </button>
      </div>

      <!-- Weather data -->
      <div v-else-if="weatherData" class="text-center">
        <div class="flex items-center justify-center mb-4">
          <div class="text-9xl mr-10">{{ getWeatherEmoji(weatherData.icon) }}</div>
          <div class="text-left">
            <div class="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {{ weatherData.description }}
            </div>
            <div class="text-3xl font-bold text-gray-800 dark:text-gray-200">
              {{ celsiusToFahrenheit(weatherData.temperature) }}°F
              <span class="text-lg text-gray-500 dark:text-gray-400 font-normal"
                >({{ weatherData.temperature }}°C)</span
              >
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Feels like {{ celsiusToFahrenheit(weatherData.feelsLike) }}°F ({{
                weatherData.feelsLike
              }}°C)
            </div>

            <div class="flex flex-wrap gap-4 text-sm mt-4 whitespace-nowrap">
              <div class="flex flex-wrap gap-4 bg-blue-50 dark:bg-blue-900 rounded-lg p-3">
                <div class="text-blue-600 dark:text-blue-400 font-medium">Humidity</div>
                <div class="text-gray-800 dark:text-gray-200">{{ weatherData.humidity }}%</div>
              </div>
              <div class="flex flex-wrap gap-4 bg-green-50 dark:bg-green-900 rounded-lg p-3">
                <div class="text-green-600 dark:text-green-400 font-medium">Wind Speed</div>
                <div class="text-gray-800 dark:text-gray-200">{{ weatherData.windSpeed }} m/s</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hourly Forecast -->
        <div
          v-if="weatherData.hourlyForecast && weatherData.hourlyForecast.length > 0"
          class="mt-4"
        >
          <div class="overflow-x-auto">
            <div class="flex gap-4 pb-2" style="min-width: max-content">
              <div
                v-for="(hour, index) in weatherData.hourlyForecast.slice(0, 12)"
                :key="index"
                class="flex-shrink-0 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center min-w-20"
              >
                <div class="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {{ formatHourTime(hour.time) }}
                </div>
                <div class="text-2xl mb-1">{{ getWeatherEmoji(hour.icon) }}</div>
                <div class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {{ celsiusToFahrenheit(hour.temperature) }}°
                </div>
                <div
                  v-if="hour.precipitationProbability > 0"
                  class="text-xs text-blue-600 dark:text-blue-400 mt-1"
                >
                  {{ hour.precipitationProbability }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Location Information -->
        <div v-if="locationStore.formattedLocation" class="mt-4">
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
            <div class="flex items-center justify-center mb-2">
              <svg
                class="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
              <span class="text-lg font-medium text-gray-800 dark:text-gray-200">
                {{ locationStore.formattedLocation }}
              </span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ coordinates?.lat.toFixed(4) }}, {{ coordinates?.lon.toFixed(4) }}
            </p>
          </div>
        </div>

        <!-- Google Maps Static Image -->
        <div v-if="coordinates" class="mt-6">
          <img
            :src="cachedMapImage || getStaticMapUrl(coordinates.lat, coordinates.lon)"
            :alt="`Map of ${locationStore.formattedLocation || weatherData.location}`"
            class="w-full h-auto object-cover rounded-lg border border-gray-200 dark:border-gray-600"
            @error="handleMapError"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, watch } from 'vue';
import LoadingSpinner from '../LoadingSpinner.vue';
import { useWeatherStore, useLocationStore } from '../../stores';
import ExpandWidget from './ExpandWidget.vue';
import type { WeatherData } from '../../stores/types';

export default defineComponent({
  name: 'WeatherWidget',
  components: {
    LoadingSpinner,
    ExpandWidget,
  },
  setup() {
    const weatherStore = useWeatherStore();
    const locationStore = useLocationStore();
    const weatherData = ref<WeatherData | null>(null);
    const cachedMapImage = ref<string | null>(null);
    const showAllHours = ref(false);

    // You'll need to add your Google Maps API key here
    const GOOGLE_MAPS_API_KEY =
      // @ts-ignore
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';

    const coordinates = computed(() => {
      return weatherStore.coordinatesCache?.data || null;
    });

    const celsiusToFahrenheit = (celsius: number): number => {
      return Math.round((celsius * 9) / 5 + 32);
    };

    const getCacheKey = (lat: number, lon: number): string => {
      return `weather-map-${lat.toFixed(4)}-${lon.toFixed(4)}`;
    };

    const cleanupOldCachedImages = () => {
      try {
        const keys = Object.keys(localStorage);
        const mapCacheKeys = keys.filter(key => key.startsWith('weather-map-'));

        // Keep only the 5 most recent cached map images
        if (mapCacheKeys.length > 5) {
          const keysToRemove = mapCacheKeys.slice(0, mapCacheKeys.length - 5);
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
      } catch (error) {
        console.warn('Failed to cleanup old cached images:', error);
      }
    };

    const getStaticMapUrl = (lat: number, lon: number): string => {
      const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
      const params = new URLSearchParams({
        center: `${lat},${lon}`,
        zoom: '12',
        size: '400x150',
        maptype: 'roadmap',
        markers: `color:red|${lat},${lon}`,
        key: GOOGLE_MAPS_API_KEY,
        style: 'feature:poi|visibility:off', // Hide points of interest for cleaner look
      });

      return `${baseUrl}?${params.toString()}`;
    };

    const fetchImageAsBase64 = async (url: string): Promise<string> => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Failed to fetch image as base64:', error);
        throw error;
      }
    };

    const loadCachedMapImage = async (lat: number, lon: number) => {
      const cacheKey = getCacheKey(lat, lon);

      // Check if we have a cached version
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        cachedMapImage.value = cached;
        return;
      }

      // If not cached, fetch and cache it
      try {
        const mapUrl = getStaticMapUrl(lat, lon);
        const base64Image = await fetchImageAsBase64(mapUrl);

        // Cleanup old cached images before storing new one
        cleanupOldCachedImages();

        // Store in localStorage
        localStorage.setItem(cacheKey, base64Image);
        cachedMapImage.value = base64Image;
      } catch (error) {
        console.error('Failed to load and cache map image:', error);
        // Fallback to direct URL if caching fails
        cachedMapImage.value = getStaticMapUrl(lat, lon);
      }
    };

    const handleMapError = (event: Event) => {
      console.warn('Failed to load Google Maps image. Please check your API key.');
      const img = event.target as HTMLImageElement;
      img.style.display = 'none';
    };

    // Watch for coordinate changes and update cached image
    const updateMapImage = async () => {
      if (coordinates.value) {
        await loadCachedMapImage(coordinates.value.lat, coordinates.value.lon);
      }
    };

    const getWeatherEmoji = (icon: string): string => {
      const iconMap: Record<string, string> = {
        'clear-day': '☀️',
        'clear-night': '🌙',
        'partly-cloudy-day': '⛅',
        'partly-cloudy-night': '☁️',
        cloudy: '☁️',
        rain: '🌧️',
        'showers-day': '🌦️',
        'showers-night': '🌧️',
        snow: '❄️',
        'snow-showers-day': '🌨️',
        'snow-showers-night': '🌨️',
        'thunder-rain': '⛈️',
        'thunder-showers-day': '⛈️',
        'thunder-showers-night': '⛈️',
        fog: '🌫️',
        wind: '💨',
        sleet: '🌨️',
        hail: '🌨️',
      };

      return iconMap[icon] || '🌤️'; // Default to sun-behind-cloud emoji
    };

    const loadWeather = async (forceRefresh = false) => {
      try {
        const data = await weatherStore.loadWeather(forceRefresh);
        weatherData.value = data;

        // Load location data if we have coordinates
        if (coordinates.value) {
          try {
            await locationStore.loadLocation(coordinates.value, forceRefresh);
          } catch (error) {
            console.warn('Failed to load location data:', error);
          }
        }

        // Load cached map image after weather data is loaded
        await updateMapImage();
      } catch (error) {
        console.error('Failed to load weather:', error);
      }
    };

    const retryLocation = () => {
      loadWeather();
    };

    // Watch for coordinate changes and update cached image
    watch(
      coordinates,
      async (newCoords, oldCoords) => {
        if (
          newCoords &&
          (!oldCoords || newCoords.lat !== oldCoords.lat || newCoords.lon !== oldCoords.lon)
        ) {
          await updateMapImage();
        }
      },
      { immediate: false }
    );

    const formatHourTime = (timeString: string): string => {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    onMounted(() => {
      loadWeather();
    });

    return {
      weatherStore,
      locationStore,
      weatherData,
      coordinates,
      retryLocation,
      getWeatherEmoji,
      celsiusToFahrenheit,
      getStaticMapUrl,
      handleMapError,
      cachedMapImage,
      updateMapImage,
      loadWeather,
      showAllHours,
      formatHourTime,
    };
  },
});
</script>
