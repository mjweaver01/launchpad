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

    <div v-else-if="weatherData" class="weather-content">
      <div class="weather-description">
        {{ weatherData.description }}
      </div>
      <div class="weather-hero">
        <div class="weather-hero-text">
          <div class="weather-temp-row">
            <span class="weather-temp">{{ celsiusToFahrenheit(weatherData.temperature) }}°</span>
            <span class="weather-temp-c">{{ weatherData.temperature }}°C</span>
          </div>
          <div class="weather-feels">
            Feels like {{ celsiusToFahrenheit(weatherData.feelsLike) }}°
          </div>
        </div>
        <component
          :is="getWeatherIcon(weatherData.icon)"
          class="weather-icon text-[color:var(--color-brand-600)]"
          stroke-width="1.25"
        />
      </div>

      <div class="weather-stats">
        <div
          class="weather-stat rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]"
        >
          <Droplets class="weather-stat-icon text-[color:var(--color-fg-muted)]" />
          <span class="weather-stat-label text-[color:var(--color-fg-muted)]">Humidity</span>
          <span class="weather-stat-value font-semibold text-[color:var(--color-fg)] tabular-nums">
            {{ weatherData.humidity }}%
          </span>
        </div>
        <div
          class="weather-stat rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]"
        >
          <Wind class="weather-stat-icon text-[color:var(--color-fg-muted)]" />
          <span class="weather-stat-label text-[color:var(--color-fg-muted)]">Wind</span>
          <span class="weather-stat-value font-semibold text-[color:var(--color-fg)] tabular-nums">
            {{ weatherData.windSpeed }}<span class="weather-stat-unit font-normal"> m/s</span>
          </span>
        </div>
      </div>

      <div
        v-if="weatherData.hourlyForecast && weatherData.hourlyForecast.length > 0"
        class="mt-4 -mx-6 px-6 overflow-x-auto"
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
        class="mt-4 flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3"
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

      <div v-if="coordinates && cachedMapImage" class="mt-4">
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

<style scoped>
/* Make the weather body a query container so the hero/stats scale with
   the actual card width rather than viewport-based breakpoints. */
.weather-content {
  container-type: inline-size;
}

.weather-description {
  font-size: clamp(0.8rem, 3cqi, 1.05rem);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-fg-muted);
  margin-bottom: 0.65rem;
  line-height: 1.2;
}

.weather-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-width: 0;
}

.weather-hero-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1 1 auto;
  gap: 0.85rem;
}

.weather-temp-row {
  display: flex;
  align-items: baseline;
  gap: 0.4em;
  min-width: 0;
}

.weather-temp {
  font-weight: 700;
  color: var(--color-fg);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  line-height: 0.9;
  font-size: clamp(3.25rem, 24cqi, 8rem);
}

.weather-temp-c {
  color: var(--color-fg-subtle);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  font-size: clamp(0.75rem, 3cqi, 1.05rem);
}

.weather-icon {
  flex-shrink: 0;
  width: clamp(5rem, 32cqi, 10rem);
  height: clamp(5rem, 32cqi, 10rem);
}

.weather-feels {
  font-size: clamp(0.8rem, 3.2cqi, 1.05rem);
  color: var(--color-fg-muted);
  line-height: 1.2;
}

.weather-stats {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.weather-stat {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.8rem;
  line-height: 1.15;
}

.weather-stat-label {
  font-size: clamp(0.8rem, 3.2cqi, 1.05rem);
  flex: 1 1 auto;
  min-width: 0;
}

.weather-stat-icon {
  width: clamp(0.95rem, 3.6cqi, 1.2rem);
  height: clamp(0.95rem, 3.6cqi, 1.2rem);
  flex-shrink: 0;
}

.weather-stat-value {
  font-size: clamp(1.1rem, 4.6cqi, 1.55rem);
  flex-shrink: 0;
  white-space: nowrap;
}

.weather-stat-unit {
  font-size: 0.7em;
}
</style>
