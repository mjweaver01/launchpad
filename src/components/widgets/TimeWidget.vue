<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { Clock, Watch, MapPin } from 'lucide-vue-next';
import { useLocationStore, useWeatherStore } from '../../stores';
import WidgetCard from './WidgetCard.vue';
import IconButton from '../ui/IconButton.vue';

const locationStore = useLocationStore();
const weatherStore = useWeatherStore();
const currentTime = ref(new Date());
const showAnalogClock = ref(false);
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

const toggleClockType = () => {
  showAnalogClock.value = !showAnalogClock.value;
  localStorage.setItem('timeWidget-analogClock', JSON.stringify(showAnalogClock.value));
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
    const saved = localStorage.getItem('timeWidget-analogClock');
    if (saved) showAnalogClock.value = JSON.parse(saved);
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
      <IconButton
        :icon="showAnalogClock ? Clock : Watch"
        :label="showAnalogClock ? 'Switch to digital' : 'Switch to analog'"
        @click="toggleClockType"
      />
    </template>

    <template v-if="!showAnalogClock">
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

