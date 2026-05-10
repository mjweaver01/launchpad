<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { Clock, Watch, LayoutGrid, MapPin } from 'lucide-vue-next';
import { useLocationStore, useWeatherStore } from '../../stores';
import WidgetCard from './WidgetCard.vue';
import IconButton from '../ui/IconButton.vue';
import FlipDigit from './FlipDigit.vue';

type ClockMode = 'digital' | 'scoreboard' | 'analog';
const CLOCK_MODE_ORDER: ClockMode[] = ['digital', 'scoreboard', 'analog'];

const locationStore = useLocationStore();
const weatherStore = useWeatherStore();
const currentTime = ref(new Date());
const clockMode = ref<ClockMode>('digital');
let intervalId: ReturnType<typeof setInterval> | null = null;

const formattedTime = computed(() =>
  currentTime.value.toLocaleTimeString('en-US', {
    hour12: true,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
);

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
      return LayoutGrid;
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

const cycleClockMode = () => {
  clockMode.value = nextClockMode.value;
  localStorage.setItem('timeWidget-clockMode', clockMode.value);
};

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

  try {
    const savedMode = localStorage.getItem('timeWidget-clockMode');
    if (
      savedMode === 'digital' ||
      savedMode === 'scoreboard' ||
      savedMode === 'analog'
    ) {
      clockMode.value = savedMode;
    } else {
      // Migrate the older boolean preference key.
      const legacy = localStorage.getItem('timeWidget-analogClock');
      if (legacy && JSON.parse(legacy)) {
        clockMode.value = 'analog';
        localStorage.setItem('timeWidget-clockMode', 'analog');
      }
    }
  } catch (error) {
    console.warn('Failed to load clock type preference:', error);
  }

  intervalId = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
  loadLocationData();
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<template>
  <WidgetCard
    title="Time"
    :icon="Clock"
    widgetName="time"
    displayName="Time"
    body-class="!flex flex-col items-center justify-center text-center"
  >
    <template #actions>
      <IconButton :icon="nextModeIcon" :label="nextModeLabel" @click="cycleClockMode" />
    </template>

    <template v-if="clockMode === 'digital'">
      <!-- Fluid time: SVG text scales uniformly to fill card width without distortion -->
      <div class="w-full">
        <svg
          class="block w-full"
          :viewBox="`0 0 ${formattedTime.length * 56} 100`"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Current time"
        >
          <text
            x="50%"
            y="82"
            text-anchor="middle"
            class="font-mono fill-fg"
            font-weight="700"
            font-size="100"
            style="font-variant-numeric: tabular-nums; letter-spacing: -0.05em"
          >
            {{ formattedTime }}
          </text>
        </svg>
      </div>
      <div class="text-sm sm:text-base text-fg-muted mt-2 truncate max-w-full">
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
          <span class="scoreboard-period">{{ scoreboardParts.period }}</span>
        </div>
      </div>
      <div class="text-sm sm:text-base text-fg-muted mt-3 truncate max-w-full">
        {{ formattedDate }}
      </div>
    </template>

    <template v-else>
      <div class="relative aspect-square w-full max-w-[min(80%,16rem)]">
        <svg class="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="98"
            class="fill-[color:var(--color-surface)] stroke-[color:var(--color-border)]"
            stroke-width="2"
          />
          <g v-for="hour in 12" :key="hour" class="text-[color:var(--color-fg-muted)]">
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
            class="stroke-[color:var(--color-fg)]"
            stroke-width="6"
            stroke-linecap="round"
          />
          <line
            x1="100"
            y1="100"
            :x2="100 + 70 * Math.cos((minuteAngle * Math.PI) / 180)"
            :y2="100 + 70 * Math.sin((minuteAngle * Math.PI) / 180)"
            class="stroke-[color:var(--color-fg-muted)]"
            stroke-width="4"
            stroke-linecap="round"
          />
          <line
            x1="100"
            y1="100"
            :x2="100 + 80 * Math.cos((secondAngle * Math.PI) / 180)"
            :y2="100 + 80 * Math.sin((secondAngle * Math.PI) / 180)"
            class="stroke-[color:var(--color-brand-600)]"
            stroke-width="2"
            stroke-linecap="round"
          />
          <circle cx="100" cy="100" r="5" class="fill-[color:var(--color-fg)]" />
        </svg>
      </div>
      <div class="text-sm text-[color:var(--color-fg-muted)] mt-3">{{ formattedDate }}</div>
    </template>

    <div
      v-if="locationStore.formattedLocation"
      class="text-xs text-[color:var(--color-fg-muted)] mt-2 flex items-center justify-center gap-1 truncate max-w-full"
    >
      <MapPin class="h-3 w-3 flex-shrink-0" />
      <span class="truncate">{{ locationStore.formattedLocation }}</span>
    </div>
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
  padding-bottom: 0.6em;
}
</style>
