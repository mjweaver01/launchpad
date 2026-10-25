<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { Clock, Watch, SquareSplitVertical, MapPin, Settings2 } from 'lucide-vue-next';
import {
  useAppFontStore,
  useLocationStore,
  useWeatherStore,
  useWidgetSettingsStore,
} from '../../stores';
import type { TimeClockMode, TimeWidgetSettings } from '../../stores/widgetSettings';
import { fontSelectOptions, getFont } from '../../assets/fonts';
import WidgetCard from './WidgetCard.vue';
import IconButton from '../ui/IconButton.vue';
import FlipDigit from './FlipDigit.vue';
import Popover from '../ui/Popover.vue';
import { usePopover } from '../../composables/usePopover';
import UiSelect from '../ui/UiSelect.vue';
import UiToggle from '../ui/UiToggle.vue';
import UiButton from '../ui/UiButton.vue';

const props = withDefaults(
  defineProps<{
    widgetId?: string;
  }>(),
  {
    widgetId: 'time',
  }
);

type ClockMode = TimeClockMode;
const CLOCK_MODE_ORDER: ClockMode[] = ['digital', 'scoreboard', 'analog'];

const locationStore = useLocationStore();
const weatherStore = useWeatherStore();
const widgetSettingsStore = useWidgetSettingsStore();
const route = useRoute();
const currentTime = ref(new Date());
const settings = ref<TimeWidgetSettings>(widgetSettingsStore.getTimeSettings(props.widgetId));
const clockMode = computed(() => settings.value.clockMode);
const showSeconds = computed(() => settings.value.showSeconds);
const showPeriod = computed(() => settings.value.showPeriod);
const appFontStore = useAppFontStore();
// 'app' follows the app-wide font; otherwise the clock has its own.
const clockFont = computed(() =>
  getFont(settings.value.font === 'app' ? appFontStore.fontId : settings.value.font)
);
const isFullScreen = computed(() => route.name === 'Full Screen');
const settingsPopover = usePopover();
let intervalId: ReturnType<typeof setInterval> | null = null;

const updateSettings = (patch: Partial<TimeWidgetSettings>) => {
  settings.value = { ...settings.value, ...patch };
  widgetSettingsStore.setTimeSettings(props.widgetId, patch);
};

// Time only: big rounded digits, no seconds, AM/PM, date or location.
const applyTimeOnlyPreset = () =>
  updateSettings({
    clockMode: 'digital',
    font: 'rounded',
    showSeconds: false,
    showPeriod: false,
    showDate: false,
    showLocation: false,
  });

const styleOptions = [
  { label: 'Digital', value: 'digital' },
  { label: 'Flip', value: 'scoreboard' },
  { label: 'Analog', value: 'analog' },
];
const fontOptions = [{ label: 'App font', value: 'app' }, ...fontSelectOptions];

const formattedTime = computed(() =>
  currentTime.value.toLocaleTimeString('en-US', {
    hour12: true,
    hour: 'numeric',
    minute: '2-digit',
    ...(showSeconds.value ? { second: '2-digit' as const } : {}),
  })
);

// Split "11:48 PM" so the AM/PM sits a small fixed gap from the digits. The
// separator is a full-width space in the monospace font (Chrome also emits a
// narrow no-break space, U+202F), which left a gap as wide as a digit.
const PERIOD_GAP = 14; // SVG units at font-size 100, about 0.14em
const digitalParts = computed(() => {
  const match = formattedTime.value.match(/^(.*?)[\s\u202f]+([AP]M)$/i);
  const parts = match
    ? { time: match[1], period: match[2] }
    : { time: formattedTime.value, period: '' };
  return showPeriod.value ? parts : { time: parts.time, period: '' };
});

// The digital clock is SVG text sized to fill the card. Fonts differ in width
// (and most aren't monospace), so measure the rendered text and fit the
// viewBox to it, instead of estimating from the character count.
const digitalText = ref<SVGTextElement | null>(null);
const digitalViewBox = ref('0 -78 400 100');
const measureDigital = () => {
  const el = digitalText.value;
  if (!el) return;
  const box = el.getBBox();
  if (!box.width || !box.height) return; // hidden or not laid out yet
  const pad = box.height * 0.02;
  digitalViewBox.value = `${box.x - pad} ${box.y} ${box.width + pad * 2} ${box.height}`;
};
watch(
  () => [digitalParts.value.time, digitalParts.value.period, clockFont.value.id, clockMode.value],
  () => nextTick(measureDigital),
  { flush: 'post' }
);
// Webfonts load after first paint; re-measure once they arrive.
const onFontsLoaded = () => measureDigital();

const formattedDate = computed(() =>
  currentTime.value.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
);

const scoreboardParts = computed(() => {
  const parts = currentTime.value.toLocaleTimeString('en-US', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
  });
  const [time, period] = parts.split(' ');
  const [hh, mm] = time.split(':');
  return {
    h1: hh[0],
    h2: hh[1],
    m1: mm[0],
    m2: mm[1],
    period,
  };
});

const hourAngle = computed(() => {
  const hours = currentTime.value.getHours() % 12;
  const minutes = currentTime.value.getMinutes();
  return hours * 30 + minutes * 0.5;
});

const minuteAngle = computed(() => {
  const minutes = currentTime.value.getMinutes();
  const seconds = currentTime.value.getSeconds();
  return minutes * 6 + seconds * 0.1;
});

const secondAngle = computed(() => currentTime.value.getSeconds() * 6);

const nextClockMode = computed<ClockMode>(() => {
  const idx = CLOCK_MODE_ORDER.indexOf(clockMode.value);
  return CLOCK_MODE_ORDER[(idx + 1) % CLOCK_MODE_ORDER.length];
});

const nextModeIcon = computed(() => {
  switch (nextClockMode.value) {
    case 'digital':
      return Clock;
    case 'scoreboard':
      return SquareSplitVertical;
    case 'analog':
      return Watch;
  }
});

const nextModeLabel = computed(() => {
  switch (nextClockMode.value) {
    case 'digital':
      return 'Switch to digital';
    case 'scoreboard':
      return 'Switch to scoreboard';
    case 'analog':
      return 'Switch to analog';
  }
});

const cycleClockMode = () => updateSettings({ clockMode: nextClockMode.value });

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
  locationStore.initializeFromStorage();
  weatherStore.initializeFromStorage();

  settings.value = widgetSettingsStore.getTimeSettings(props.widgetId);
  document.fonts?.addEventListener('loadingdone', onFontsLoaded);
  document.fonts?.ready.then(onFontsLoaded);
  nextTick(measureDigital);

  intervalId = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
  loadLocationData();
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
  document.fonts?.removeEventListener('loadingdone', onFontsLoaded);
});
</script>

<template>
  <WidgetCard
    title="Time"
    :icon="Clock"
    widgetName="time"
    displayName="Time"
    body-class="flex! flex-col items-center justify-center text-center"
  >
    <template #actions>
      <IconButton
        :icon="Settings2"
        label="Clock settings"
        :aria-expanded="settingsPopover.isOpen.value"
        @click="settingsPopover.toggle"
      />
      <IconButton :icon="nextModeIcon" :label="nextModeLabel" @click="cycleClockMode" />
    </template>

    <template v-if="clockMode === 'digital'">
      <!-- Fluid time: SVG text scales uniformly to fill card width without distortion -->
      <div class="w-full">
        <svg
          class="block w-full"
          :class="{ 'max-h-[70dvh]': isFullScreen }"
          :viewBox="digitalViewBox"
          preserveAspectRatio="xMidYMid meet"
          :aria-label="`Current time ${formattedTime}`"
        >
          <!-- x/y at the origin: the viewBox is fitted to this text's measured box -->
          <text
            ref="digitalText"
            x="0"
            y="0"
            class="fill-fg"
            font-size="100"
            :font-weight="clockFont.clock.weight"
            :style="{
              fontFamily: clockFont.stack,
              letterSpacing: clockFont.clock.letterSpacing,
              fontVariantNumeric: 'tabular-nums',
            }"
          >
            <tspan>{{ digitalParts.time }}</tspan>
            <tspan v-if="digitalParts.period" :dx="PERIOD_GAP">{{ digitalParts.period }}</tspan>
          </text>
        </svg>
      </div>
      <div
        v-if="settings.showDate"
        class="text-sm sm:text-base text-fg-muted mt-2 truncate max-w-full"
      >
        {{ formattedDate }}
      </div>
    </template>

    <template v-else-if="clockMode === 'scoreboard'">
      <div class="scoreboard-wrap">
        <div class="scoreboard" aria-label="Current time">
          <FlipDigit :value="scoreboardParts.h1" />
          <FlipDigit :value="scoreboardParts.h2" />
          <span class="scoreboard-colon" aria-hidden="true">:</span>
          <FlipDigit :value="scoreboardParts.m1" />
          <FlipDigit :value="scoreboardParts.m2" />
          <span v-if="showPeriod" class="scoreboard-period">{{ scoreboardParts.period }}</span>
        </div>
      </div>
      <div
        v-if="settings.showDate"
        class="text-sm sm:text-base text-fg-muted mt-3 truncate max-w-full"
      >
        {{ formattedDate }}
      </div>
    </template>

    <template v-else>
      <div class="relative aspect-square w-full max-w-[min(80%,16rem)]">
        <svg class="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="98" class="fill-surface stroke-border" stroke-width="2" />
          <g v-for="hour in 12" :key="hour" class="text-fg-muted">
            <line
              :x1="100 + 85 * Math.cos(((hour * 30 - 90) * Math.PI) / 180)"
              :y1="100 + 85 * Math.sin(((hour * 30 - 90) * Math.PI) / 180)"
              :x2="100 + 75 * Math.cos(((hour * 30 - 90) * Math.PI) / 180)"
              :y2="100 + 75 * Math.sin(((hour * 30 - 90) * Math.PI) / 180)"
              stroke="currentColor"
              stroke-width="2"
            />
          </g>
          <line
            x1="100"
            y1="100"
            :x2="100 + 50 * Math.cos((hourAngle * Math.PI) / 180)"
            :y2="100 + 50 * Math.sin((hourAngle * Math.PI) / 180)"
            class="stroke-fg"
            stroke-width="6"
            stroke-linecap="round"
          />
          <line
            x1="100"
            y1="100"
            :x2="100 + 70 * Math.cos((minuteAngle * Math.PI) / 180)"
            :y2="100 + 70 * Math.sin((minuteAngle * Math.PI) / 180)"
            class="stroke-fg-muted"
            stroke-width="4"
            stroke-linecap="round"
          />
          <line
            x1="100"
            y1="100"
            :x2="100 + 80 * Math.cos((secondAngle * Math.PI) / 180)"
            :y2="100 + 80 * Math.sin((secondAngle * Math.PI) / 180)"
            class="stroke-brand-600"
            stroke-width="2"
            stroke-linecap="round"
          />
          <circle cx="100" cy="100" r="5" class="fill-fg" />
        </svg>
      </div>
      <div v-if="settings.showDate" class="text-sm text-fg-muted mt-3">{{ formattedDate }}</div>
    </template>

    <div
      v-if="settings.showLocation && locationStore.formattedLocation"
      class="text-xs text-fg-muted mt-2 flex items-center justify-center gap-1 truncate max-w-full"
    >
      <MapPin class="h-3 w-3 shrink-0" />
      <span class="truncate">{{ locationStore.formattedLocation }}</span>
    </div>

    <Popover
      :open="settingsPopover.isOpen.value"
      :anchor="settingsPopover.anchor.value"
      title="Clock settings"
      @close="settingsPopover.close"
    >
      <div class="space-y-4 text-left">
        <UiSelect
          id="clock-style"
          label="Style"
          :model-value="settings.clockMode"
          :options="styleOptions"
          @change="v => updateSettings({ clockMode: v as TimeClockMode })"
        />
        <UiSelect
          v-if="clockMode === 'digital'"
          id="clock-font"
          label="Font"
          :model-value="settings.font"
          :options="fontOptions"
          @change="v => updateSettings({ font: v as TimeWidgetSettings['font'] })"
        />
        <UiToggle
          v-if="clockMode === 'digital'"
          label="Seconds"
          :model-value="settings.showSeconds"
          @update:model-value="v => updateSettings({ showSeconds: v })"
        />
        <UiToggle
          v-if="clockMode !== 'analog'"
          label="AM/PM"
          :model-value="settings.showPeriod"
          @update:model-value="v => updateSettings({ showPeriod: v })"
        />
        <UiToggle
          label="Date"
          :model-value="settings.showDate"
          @update:model-value="v => updateSettings({ showDate: v })"
        />
        <UiToggle
          label="Location"
          :model-value="settings.showLocation"
          @update:model-value="v => updateSettings({ showLocation: v })"
        />
        <UiButton variant="secondary" size="sm" @click="applyTimeOnlyPreset"> Time only </UiButton>
      </div>
    </Popover>
  </WidgetCard>
</template>

<style scoped>
.scoreboard-wrap {
  container-type: inline-size;
  width: 100%;
  display: flex;
  justify-content: center;
}

.scoreboard {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.12em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  /* Scale with the parent card width via container queries.
     Total content is ~4.2em wide (4 digits + colon + period + gaps),
     so ~22cqi fills the card while clamp() keeps it sane on tiny/huge layouts. */
  font-size: clamp(2.25rem, 22cqi, 7rem);
  line-height: 1;
  color: var(--color-fg);
  letter-spacing: 0;
}

.scoreboard-colon {
  display: inline-block;
  padding: 0 0.05em;
  color: var(--color-fg-muted);
  transform: translateY(-0.04em);
}

.scoreboard-period {
  display: inline-block;
  margin-left: 0.35em;
  font-size: 0.32em;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-fg-muted);
  align-self: flex-end;
  padding-bottom: 1em;
}
</style>
