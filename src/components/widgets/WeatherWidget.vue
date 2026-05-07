<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import {
  CloudSun,
  RefreshCw,
  MapPin,
  Sun,
  Moon,
  CloudFog,
  Wind,
  Droplets,
  Snowflake,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Cloud,
} from 'lucide-vue-next';
import type { Component } from 'vue';
import { useWeatherStore, useLocationStore } from '../../stores';
import WidgetCard from './WidgetCard.vue';
import IconButton from '../ui/IconButton.vue';
import Spinner from '../ui/Spinner.vue';
import ErrorState from '../ui/ErrorState.vue';

const weatherStore = useWeatherStore();
const locationStore = useLocationStore();
const cachedMapImage = ref<string | null>(null);

const coordinates = computed(() => weatherStore.coordinatesCache?.data || null);
const weatherData = computed(() => weatherStore.weatherCache?.data || null);

const celsiusToFahrenheit = (c: number) => Math.round((c * 9) / 5 + 32);

const ICON_MAP: Record<string, Component> = {
  'clear-day': Sun,
  'clear-night': Moon,
  'partly-cloudy-day': CloudSun,
  'partly-cloudy-night': Cloud,
  cloudy: Cloud,
  rain: CloudRain,
  'showers-day': CloudRain,
  'showers-night': CloudRain,
  snow: CloudSnow,
  'snow-showers-day': CloudSnow,
  'snow-showers-night': CloudSnow,
  'thunder-rain': CloudLightning,
  'thunder-showers-day': CloudLightning,
  'thunder-showers-night': CloudLightning,
  fog: CloudFog,
  wind: Wind,
  sleet: Snowflake,
  hail: Snowflake,
};
const getWeatherIcon = (icon: string): Component => ICON_MAP[icon] ?? CloudSun;

const formatHourTime = (timeString: string) => {
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
};

const getCacheKey = (lat: number, lon: number) => `weather-map-${lat.toFixed(4)}-${lon.toFixed(4)}`;

const cleanupOldCachedImages = () => {
  try {
    const keys = Object.keys(localStorage);
    const mapCacheKeys = keys.filter(key => key.startsWith('weather-map-'));
    if (mapCacheKeys.length > 5) {
      mapCacheKeys.slice(0, mapCacheKeys.length - 5).forEach(k => localStorage.removeItem(k));
    }
  } catch (error) {
    console.warn('Failed to cleanup old cached images:', error);
  }
};

const getStaticMapFromBackend = async (lat: number, lon: number): Promise<string> => {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    zoom: '12',
    size: '400x150',
  });
  const response = await fetch(`/.netlify/functions/static-map?${params}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.image;
};

const loadCachedMapImage = async (lat: number, lon: number) => {
  const cacheKey = getCacheKey(lat, lon);
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    cachedMapImage.value = cached;
    return;
  }
  try {
    const base64Image = await getStaticMapFromBackend(lat, lon);
    cleanupOldCachedImages();
    localStorage.setItem(cacheKey, base64Image);
    cachedMapImage.value = base64Image;
  } catch (error) {
    console.error('Failed to load and cache map image:', error);
    cachedMapImage.value = null;
  }
};

const handleMapError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
};

watch(
  () => coordinates.value,
  newCoords => {
    if (newCoords) loadCachedMapImage(newCoords.lat, newCoords.lon);
  },
  { immediate: true }
);

const loadWeather = async (force = false) => {
  await weatherStore.loadWeather(force);
};

const retryLocation = () => loadWeather(true);

onMounted(() => {
  weatherStore.initializeFromStorage();
  if (!weatherStore.weatherCache?.data) loadWeather();
});
</script>

<template>
  <WidgetCard title="Weather" :icon="CloudSun" widgetName="weather" displayName="Weather">
    <template #actions>
      <IconButton
        :icon="RefreshCw"
        :spin="weatherStore.loading"
        :disabled="weatherStore.loading"
        label="Refresh weather"
        @click="loadWeather(true)"
      />
    </template>

    <div v-if="weatherStore.loading && !weatherData" class="text-center py-8">
      <Spinner :size="32" />
      <p class="text-sm text-[color:var(--color-fg-muted)] mt-3">Getting your location…</p>
    </div>

    <ErrorState
      v-else-if="weatherStore.error"
      :message="weatherStore.error"
      retry-label="Try again"
      @retry="retryLocation"
    />

    <div v-else-if="weatherData">
      <div class="text-sm uppercase tracking-wider text-[color:var(--color-fg-muted)] mb-2">
        {{ weatherData.description }}
      </div>
      <div class="flex items-center justify-between gap-3 min-w-0">
        <div class="flex items-baseline gap-2 min-w-0">
          <span
            class="text-7xl sm:text-8xl font-bold text-[color:var(--color-fg)] leading-[0.9] tabular-nums tracking-tight"
            >{{ celsiusToFahrenheit(weatherData.temperature) }}°</span
          >
          <span class="text-sm text-[color:var(--color-fg-subtle)] tabular-nums whitespace-nowrap"
            >{{ weatherData.temperature }}°C</span
          >
        </div>
        <component
          :is="getWeatherIcon(weatherData.icon)"
          class="h-20 w-20 sm:h-24 sm:w-24 text-[color:var(--color-brand-600)] flex-shrink-0"
          stroke-width="1.25"
        />
      </div>
      <div class="text-sm text-[color:var(--color-fg-muted)] mt-1">
        Feels like {{ celsiusToFahrenheit(weatherData.feelsLike) }}°
      </div>

      <div class="flex gap-3 mt-5">
        <div
          class="flex-1 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3"
        >
          <div class="flex items-center gap-1.5 text-sm text-[color:var(--color-fg-muted)] mb-1">
            <Droplets class="h-4 w-4" />
            Humidity
          </div>
          <div class="text-2xl font-semibold text-[color:var(--color-fg)] tabular-nums">
            {{ weatherData.humidity }}%
          </div>
        </div>
        <div
          class="flex-1 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3"
        >
          <div class="flex items-center gap-1.5 text-sm text-[color:var(--color-fg-muted)] mb-1">
            <Wind class="h-4 w-4" />
            Wind
          </div>
          <div class="text-2xl font-semibold text-[color:var(--color-fg)] tabular-nums">
            {{ weatherData.windSpeed }}<span class="text-sm font-normal"> m/s</span>
          </div>
        </div>
      </div>

      <div
        v-if="weatherData.hourlyForecast && weatherData.hourlyForecast.length > 0"
        class="mt-5 -mx-6 px-6 overflow-x-auto"
      >
        <div class="flex gap-2 pb-1" style="min-width: max-content">
          <div
            v-for="(hour, index) in weatherData.hourlyForecast.slice(0, 12)"
            :key="index"
            class="flex-shrink-0 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 text-center w-[4.5rem]"
          >
            <div class="text-xs text-[color:var(--color-fg-muted)] mb-1 tabular-nums">
              {{ formatHourTime(hour.time) }}
            </div>
            <component
              :is="getWeatherIcon(hour.icon)"
              class="h-6 w-6 mx-auto text-[color:var(--color-fg-muted)]"
              stroke-width="1.5"
            />
            <div class="text-base font-semibold text-[color:var(--color-fg)] mt-1 tabular-nums">
              {{ celsiusToFahrenheit(hour.temperature) }}°
            </div>
            <div
              v-if="hour.precipitationProbability > 0"
              class="text-xs text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)] mt-0.5 tabular-nums"
            >
              {{ hour.precipitationProbability }}%
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="locationStore.formattedLocation"
        class="mt-5 flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3"
      >
        <MapPin class="h-4 w-4 text-[color:var(--color-fg-muted)] flex-shrink-0" />
        <div class="min-w-0">
          <div class="text-base font-medium text-[color:var(--color-fg)] truncate">
            {{ locationStore.formattedLocation }}
          </div>
          <div class="text-sm text-[color:var(--color-fg-subtle)] tabular-nums">
            {{ coordinates?.lat.toFixed(4) }}, {{ coordinates?.lon.toFixed(4) }}
          </div>
        </div>
      </div>

      <div v-if="coordinates && cachedMapImage" class="mt-3 -mx-6">
        <img
          :src="cachedMapImage"
          :alt="`Map of ${locationStore.formattedLocation || weatherData.location}`"
          class="w-full h-auto object-cover border-y border-[color:var(--color-border)]"
          @error="handleMapError"
        />
      </div>
    </div>
  </WidgetCard>
</template>
