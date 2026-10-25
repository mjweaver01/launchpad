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
import { Settings2 } from 'lucide-vue-next';
import { useWeatherStore, useLocationStore, useWidgetSettingsStore } from '../../stores';
import type { WeatherLayout } from '../../stores/widgetSettings';
import WidgetCard from './WidgetCard.vue';
import IconButton from '../ui/IconButton.vue';
import Popover from '../ui/Popover.vue';
import { usePopover } from '../../composables/usePopover';
import UiSelect from '../ui/UiSelect.vue';
import Spinner from '../ui/Spinner.vue';
import ErrorState from '../ui/ErrorState.vue';

const props = withDefaults(defineProps<{ widgetId?: string }>(), { widgetId: 'weather' });

const weatherStore = useWeatherStore();
const locationStore = useLocationStore();
const widgetSettingsStore = useWidgetSettingsStore();
const layout = ref<WeatherLayout>(widgetSettingsStore.getWeatherSettings(props.widgetId).layout);
const compactScale = ref(widgetSettingsStore.getWeatherSettings(props.widgetId).compactScale);

const onCompactScale = (event: Event) => {
  compactScale.value = Number((event.target as HTMLInputElement).value);
  widgetSettingsStore.setWeatherSettings(props.widgetId, { compactScale: compactScale.value });
};
const settingsPopover = usePopover();

const layoutOptions = [
  { label: 'Full: details, hourly, map', value: 'full' },
  { label: 'Summary: conditions and next hours', value: 'summary' },
  { label: 'Compact: icon and temperature', value: 'compact' },
];

const setLayout = (value: WeatherLayout) => {
  layout.value = value;
  widgetSettingsStore.setWeatherSettings(props.widgetId, { layout: value });
};
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

// Color treatment for the compact layout icon: a filled orange sun
// with yellow rays, pale moon, grey clouds, blue rain and so on.
const getIconTone = (icon: string): string => {
  if (icon === 'clear-day') return 'wx-sun';
  if (icon === 'clear-night') return 'wx-moon';
  if (icon.startsWith('thunder')) return 'wx-storm';
  if (icon.includes('rain') || icon.startsWith('showers')) return 'wx-rain';
  if (icon.includes('snow') || icon === 'sleet' || icon === 'hail') return 'wx-snow';
  if (icon === 'partly-cloudy-day') return 'wx-sun-cloud';
  return 'wx-cloud';
};

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
  const weatherSettings = widgetSettingsStore.getWeatherSettings(props.widgetId);
  layout.value = weatherSettings.layout;
  compactScale.value = weatherSettings.compactScale;
  weatherStore.initializeFromStorage();
  if (!weatherStore.weatherCache?.data) loadWeather();
});
</script>

<template>
  <WidgetCard
    title="Weather"
    :icon="CloudSun"
    widgetName="weather"
    displayName="Weather"
    :body-class="layout === 'compact' ? 'flex! flex-col items-center justify-center' : ''"
  >
    <template #actions>
      <IconButton
        :icon="Settings2"
        label="Weather settings"
        :aria-expanded="settingsPopover.isOpen.value"
        @click="settingsPopover.toggle"
      />
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
      <p class="text-sm text-fg-muted mt-3">Getting your location…</p>
    </div>

    <ErrorState
      v-else-if="weatherStore.error"
      :message="weatherStore.error"
      retry-label="Try again"
      @retry="retryLocation"
    />

    <div
      v-else-if="weatherData && layout === 'compact'"
      class="weather-compact"
      :style="{ '--wx-scale': compactScale / 100 }"
      :aria-label="`${celsiusToFahrenheit(weatherData.temperature)} degrees, ${weatherData.description}`"
    >
      <component
        :is="getWeatherIcon(weatherData.icon)"
        class="weather-compact-icon"
        :class="getIconTone(weatherData.icon)"
        stroke-width="1.75"
      />
      <div class="weather-compact-temp">{{ celsiusToFahrenheit(weatherData.temperature) }}°</div>
    </div>

    <div v-else-if="weatherData && layout === 'summary'" class="weather-content">
      <div class="weather-description">{{ weatherData.description }}</div>
      <div class="weather-hero">
        <div class="weather-hero-text">
          <span class="weather-temp">{{ celsiusToFahrenheit(weatherData.temperature) }}°</span>
          <div class="weather-feels">
            Feels like {{ celsiusToFahrenheit(weatherData.feelsLike) }}°
          </div>
        </div>
        <component
          :is="getWeatherIcon(weatherData.icon)"
          class="weather-icon"
          :class="getIconTone(weatherData.icon)"
          stroke-width="1.5"
        />
      </div>
      <div
        v-if="weatherData.hourlyForecast && weatherData.hourlyForecast.length > 0"
        class="weather-summary-hours"
      >
        <div
          v-for="(hour, index) in weatherData.hourlyForecast.slice(0, 5)"
          :key="index"
          class="weather-summary-hour"
        >
          <div class="text-xs text-fg-muted tabular-nums">{{ formatHourTime(hour.time) }}</div>
          <component
            :is="getWeatherIcon(hour.icon)"
            class="h-6 w-6 mx-auto my-1"
            :class="getIconTone(hour.icon)"
            stroke-width="1.75"
          />
          <div class="text-sm font-semibold text-fg tabular-nums">
            {{ celsiusToFahrenheit(hour.temperature) }}°
          </div>
        </div>
      </div>
    </div>

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
          class="weather-icon text-brand-600"
          stroke-width="1.25"
        />
      </div>

      <div class="weather-stats">
        <div class="weather-stat rounded-xl border border-border bg-surface-2">
          <div class="weather-stat-head">
            <Droplets class="weather-stat-icon text-fg-muted" />
            <span class="weather-stat-label text-fg-muted">Humidity</span>
          </div>
          <span class="weather-stat-value font-semibold text-fg tabular-nums">
            {{ weatherData.humidity }}%
          </span>
        </div>
        <div class="weather-stat rounded-xl border border-border bg-surface-2">
          <div class="weather-stat-head">
            <Wind class="weather-stat-icon text-fg-muted" />
            <span class="weather-stat-label text-fg-muted">Wind</span>
          </div>
          <span class="weather-stat-value font-semibold text-fg tabular-nums">
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
            class="shrink-0 rounded-lg border border-border bg-surface p-2 text-center w-18"
          >
            <div class="text-xs text-fg-muted mb-1 tabular-nums">
              {{ formatHourTime(hour.time) }}
            </div>
            <component
              :is="getWeatherIcon(hour.icon)"
              class="h-6 w-6 mx-auto text-fg-muted"
              stroke-width="1.5"
            />
            <div class="text-base font-semibold text-fg mt-1 tabular-nums">
              {{ celsiusToFahrenheit(hour.temperature) }}°
            </div>
            <div
              v-if="hour.precipitationProbability > 0"
              class="text-xs text-brand-600 dark:text-brand-400 mt-0.5 tabular-nums"
            >
              {{ hour.precipitationProbability }}%
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="locationStore.formattedLocation"
        class="mt-4 flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3"
      >
        <MapPin class="h-4 w-4 text-fg-muted shrink-0" />
        <div class="min-w-0">
          <div class="text-base font-medium text-fg truncate">
            {{ locationStore.formattedLocation }}
          </div>
          <div class="text-sm text-fg-subtle tabular-nums">
            {{ coordinates?.lat.toFixed(4) }}, {{ coordinates?.lon.toFixed(4) }}
          </div>
        </div>
      </div>

      <div v-if="coordinates && cachedMapImage" class="mt-4">
        <img
          :src="cachedMapImage"
          :alt="`Map of ${locationStore.formattedLocation || weatherData.location}`"
          class="w-full h-auto object-cover border-y border-border"
          @error="handleMapError"
        />
      </div>
    </div>

    <Popover
      :open="settingsPopover.isOpen.value"
      :anchor="settingsPopover.anchor.value"
      title="Weather settings"
      @close="settingsPopover.close"
    >
      <div class="space-y-4">
        <UiSelect
          id="weather-layout"
          label="Layout"
          :model-value="layout"
          :options="layoutOptions"
          @change="v => setLayout(v as WeatherLayout)"
        />
        <div v-if="layout === 'compact'">
          <label class="ui-label flex justify-between" for="weather-compact-scale">
            <span>Icon and temperature size</span>
            <span class="tabular-nums text-fg-muted">{{ compactScale }}%</span>
          </label>
          <input
            id="weather-compact-scale"
            type="range"
            class="ui-range"
            min="50"
            max="150"
            step="5"
            :value="compactScale"
            @input="onCompactScale"
          />
        </div>
      </div>
    </Popover>
  </WidgetCard>
</template>

<style scoped>
/* Compact: icon and temperature tile. Sized from the card width (cqi) and capped by
   viewport height so it also fits a landscape phone in full screen. */
.weather-compact {
  container-type: inline-size;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: min(4cqi, 3dvh);
  padding: 0.5rem 0;
}

.weather-compact-icon {
  width: calc(min(55cqi, 42dvh) * var(--wx-scale, 1));
  height: calc(min(55cqi, 42dvh) * var(--wx-scale, 1));
}

.weather-compact-temp {
  font-family: var(--font-sans);
  font-weight: 800;
  font-size: calc(min(26cqi, 20dvh) * var(--wx-scale, 1));
  line-height: 1;
  color: var(--color-fg);
  font-variant-numeric: tabular-nums;
  /* Optically center: the degree sign adds width on the right only. */
  padding-left: 0.25em;
}

/* Icon color tones. Lucide icons draw with stroke=currentColor and fill=none;
   setting fill fills closed shapes (sun disc, cloud body) but not the rays. */
.wx-sun {
  color: #facc15;
  fill: #f59e0b;
}
.wx-sun-cloud {
  color: #fbbf24;
  fill: color-mix(in oklch, var(--color-fg-muted) 35%, transparent);
}
.wx-moon {
  color: var(--color-fg);
  fill: color-mix(in oklch, var(--color-fg) 85%, transparent);
}
.wx-cloud {
  color: var(--color-fg-muted);
  fill: color-mix(in oklch, var(--color-fg-muted) 35%, transparent);
}
.wx-rain {
  color: #60a5fa;
}
.wx-snow {
  color: #7dd3fc;
}
.wx-storm {
  color: #facc15;
}

.weather-summary-hours {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.375rem;
  margin-top: 1rem;
  text-align: center;
}

.weather-summary-hour {
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  padding: 0.5rem 0.25rem;
}

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
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
}

/* Very narrow cards: give each stat the full row so labels never truncate. */
@container (max-width: 15rem) {
  .weather-stats {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* Label sits above the value so the two never compete for width —
   side-by-side they collided on narrow cards. */
.weather-stat {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.6rem 0.85rem 0.65rem;
}

.weather-stat-head {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
}

.weather-stat-label {
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.weather-stat-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.weather-stat-value {
  font-size: clamp(1.15rem, 5cqi, 1.6rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.weather-stat-unit {
  font-size: 0.7em;
}
</style>
