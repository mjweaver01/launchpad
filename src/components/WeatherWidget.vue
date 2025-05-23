<template>
  <div class="bg-white rounded-lg shadow-md p-6 w-full mx-auto">
    <h2 class="text-xl font-semibold text-gray-800 mb-4 text-center">Current Weather</h2>

    <!-- Loading state -->
    <div v-if="weatherStore.loading" class="text-center">
      <LoadingSpinner />
      <p class="text-gray-600 mt-2">Getting your location...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="weatherStore.error" class="text-center">
      <div class="text-red-500 mb-2">
        <svg class="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <p class="text-red-600 text-sm">{{ weatherStore.error }}</p>
      <button
        @click="retryLocation"
        class="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
      >
        Try Again
      </button>
    </div>

    <!-- Weather data -->
    <div v-else-if="weatherData" class="text-center">
      <div class="flex items-center justify-center mb-4">
        <div class="text-6xl mr-3">{{ getWeatherEmoji(weatherData.icon) }}</div>
        <div class="text-left">
          <div class="text-3xl font-bold text-gray-800">
            {{ celsiusToFahrenheit(weatherData.temperature) }}°F
            <span class="text-lg text-gray-500 font-normal">({{ weatherData.temperature }}°C)</span>
          </div>
          <div class="text-sm text-gray-600 capitalize">{{ weatherData.description }}</div>
        </div>
      </div>

      <div class="text-sm text-gray-700 mb-4">
        <div class="font-medium">{{ weatherData.location }}</div>
        <div>
          Feels like {{ celsiusToFahrenheit(weatherData.feelsLike) }}°F ({{
            weatherData.feelsLike
          }}°C)
        </div>
      </div>

      <!-- Google Maps Static Image -->
      <div v-if="coordinates" class="mb-4">
        <img
          :src="getStaticMapUrl(coordinates.lat, coordinates.lon)"
          :alt="`Map of ${weatherData.location}`"
          class="w-full h-32 object-cover rounded-lg border border-gray-200"
          @error="handleMapError"
        />
        <p class="text-xs text-gray-500 mt-1">
          Location: {{ coordinates.lat.toFixed(4) }}, {{ coordinates.lon.toFixed(4) }}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="bg-blue-50 rounded-lg p-3">
          <div class="text-blue-600 font-medium">Humidity</div>
          <div class="text-gray-800">{{ weatherData.humidity }}%</div>
        </div>
        <div class="bg-green-50 rounded-lg p-3">
          <div class="text-green-600 font-medium">Wind Speed</div>
          <div class="text-gray-800">{{ weatherData.windSpeed }} m/s</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import LoadingSpinner from './LoadingSpinner.vue';
import { useWeatherStore } from '../stores';

export default defineComponent({
  name: 'WeatherWidget',
  components: {
    LoadingSpinner,
  },
  setup() {
    const weatherStore = useWeatherStore();
    const weatherData = ref(null);

    // You'll need to add your Google Maps API key here
    const GOOGLE_MAPS_API_KEY =
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';

    const coordinates = computed(() => {
      return weatherStore.coordinatesCache?.data || null;
    });

    const celsiusToFahrenheit = (celsius: number): number => {
      return Math.round((celsius * 9) / 5 + 32);
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

    const handleMapError = (event: Event) => {
      console.warn('Failed to load Google Maps image. Please check your API key.');
      const img = event.target as HTMLImageElement;
      img.style.display = 'none';
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

    const loadWeather = async () => {
      try {
        const data = await weatherStore.loadWeather();
        weatherData.value = data;
      } catch (error) {
        console.error('Failed to load weather:', error);
      }
    };

    const retryLocation = () => {
      loadWeather();
    };

    onMounted(() => {
      loadWeather();
    });

    return {
      weatherStore,
      weatherData,
      coordinates,
      retryLocation,
      getWeatherEmoji,
      celsiusToFahrenheit,
      getStaticMapUrl,
      handleMapError,
    };
  },
});
</script>
