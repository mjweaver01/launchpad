<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { Sun, Moon, Sparkles, Wand2 } from 'lucide-vue-next';
import { useAutoThemeStore, type ThemeLevel } from '../stores/autoTheme';
import { useDarkModeStore } from '../stores/darkMode';
import { useRedHueStore } from '../stores/redHue';
import UiToggle from '../components/ui/UiToggle.vue';
import UiButton from '../components/ui/UiButton.vue';

const autoThemeStore = useAutoThemeStore();
const darkModeStore = useDarkModeStore();
const redHueStore = useRedHueStore();

const lastUpdate = ref(Date.now());
let updateInterval: ReturnType<typeof setInterval> | null = null;

const isDarkMode = computed({
  get: () => darkModeStore.isDarkMode,
  set: () => darkModeStore.toggleDarkMode(),
});
const isRedHue = computed({
  get: () => redHueStore.isRedHue,
  set: () => redHueStore.toggleRedHue(),
});
const isAutoTheme = computed({
  get: () => autoThemeStore.isAutoThemeEnabled,
  set: () => autoThemeStore.toggleAutoTheme(),
});

const themeOptions: ThemeLevel[] = ['normal', 'dark', 'redshift'];

const localRedshiftStart = ref(autoThemeStore.redshiftStartHour);
const localRedshiftEnd = ref(autoThemeStore.redshiftEndHour);

watch(
  () => autoThemeStore.redshiftStartHour,
  v => (localRedshiftStart.value = v)
);
watch(
  () => autoThemeStore.redshiftEndHour,
  v => (localRedshiftEnd.value = v)
);

const updateRedshiftSettings = () =>
  autoThemeStore.updateRedshiftTimes(localRedshiftStart.value, localRedshiftEnd.value);

const formatHour = (hour: number) => {
  const wholeHour = Math.floor(hour);
  const minutes = Math.round((hour - wholeHour) * 60);
  const period = wholeHour >= 12 ? 'PM' : 'AM';
  const display = wholeHour > 12 ? wholeHour - 12 : wholeHour === 0 ? 12 : wholeHour;
  return `${display}:${String(minutes).padStart(2, '0')} ${period}`;
};

const themeStatus = computed(() => {
  lastUpdate.value;
  const level = autoThemeStore.effectiveThemeLevel;
  const isManual = autoThemeStore.manualOverride !== null;
  const labelMap: Record<ThemeLevel, string> = {
    normal: 'Normal',
    dark: 'Dark',
    redshift: 'Redshift',
  };
  return {
    label: labelMap[level],
    mode: isManual ? 'Manual' : 'Auto',
  };
});

const setOverride = (level: ThemeLevel) => {
  if (autoThemeStore.manualOverride === level) {
    autoThemeStore.setManualOverride(null);
  } else {
    autoThemeStore.setManualOverride(level);
  }
};

onMounted(() => {
  updateInterval = setInterval(() => (lastUpdate.value = Date.now()), 30_000);
});
onUnmounted(() => {
  if (updateInterval) clearInterval(updateInterval);
});
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 sm:px-6 py-8">
    <header class="mb-8">
      <h1 class="text-2xl font-bold tracking-tight text-[color:var(--color-fg)]">Settings</h1>
      <p class="text-sm text-[color:var(--color-fg-muted)] mt-1">
        Customize the appearance and theme schedule.
      </p>
    </header>

    <!-- Appearance -->
    <section class="ui-card mb-5">
      <header class="ui-card-header">
        <h2 class="ui-card-title">Appearance</h2>
      </header>
      <div class="ui-card-body space-y-5">
        <UiToggle
          v-model="isDarkMode"
          label="Dark mode"
          description="Use a dark color scheme"
          :icon-off="Sun"
          :icon-on="Moon"
        />
        <UiToggle
          v-model="isRedHue"
          label="Red shift"
          description="Filter blue light for late-night use"
        />
        <UiToggle
          v-model="isAutoTheme"
          label="Auto theme"
          description="Switch modes based on time of day"
          :icon-on="Wand2"
          :icon-off="Wand2"
        />
      </div>
    </section>

    <!-- Auto theme details -->
    <section v-if="autoThemeStore.isAutoThemeEnabled" class="ui-card mb-5">
      <header class="ui-card-header">
        <h2 class="ui-card-title">
          <Sparkles class="ui-card-title-icon" />
          Auto theme
        </h2>
        <span class="ui-pill ui-pill-brand">
          {{ themeStatus.label }} · {{ themeStatus.mode }}
        </span>
      </header>
      <div class="ui-card-body space-y-5">
        <div>
          <h3 class="text-sm font-medium text-[color:var(--color-fg)] mb-2">Schedule</h3>
          <div
            class="rounded-xl border border-[color:var(--color-border)] divide-y divide-[color:var(--color-border)] text-sm"
          >
            <div class="flex justify-between items-center px-4 py-2.5">
              <span class="text-[color:var(--color-fg-muted)]">Normal</span>
              <span class="text-[color:var(--color-fg)] tabular-nums">
                {{ formatHour(autoThemeStore.sunTimes.sunrise) }} –
                {{ formatHour(autoThemeStore.sunTimes.sunset) }}
              </span>
            </div>
            <div class="flex justify-between items-center px-4 py-2.5">
              <span class="text-[color:var(--color-fg-muted)]">Dark</span>
              <span class="text-[color:var(--color-fg)] tabular-nums">
                {{ formatHour(autoThemeStore.sunTimes.sunset) }} –
                {{ formatHour(autoThemeStore.redshiftStartHour) }}
              </span>
            </div>
            <div class="flex justify-between items-center px-4 py-2.5">
              <span class="text-[color:var(--color-fg-muted)]">Redshift</span>
              <span class="text-[color:var(--color-fg)] tabular-nums">
                {{ formatHour(autoThemeStore.redshiftStartHour) }} –
                {{ formatHour(autoThemeStore.redshiftEndHour) }}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-medium text-[color:var(--color-fg)] mb-2">Manual override</h3>
          <div class="grid grid-cols-3 gap-2">
            <UiButton
              v-for="level in themeOptions"
              :key="level"
              :variant="autoThemeStore.manualOverride === level ? 'primary' : 'secondary'"
              size="sm"
              @click="setOverride(level)"
            >
              {{ level.charAt(0).toUpperCase() + level.slice(1) }}
            </UiButton>
          </div>
          <UiButton
            v-if="autoThemeStore.manualOverride"
            class="mt-2"
            variant="ghost"
            size="sm"
            block
            @click="autoThemeStore.setManualOverride(null)"
          >
            Clear override
          </UiButton>
        </div>

        <div>
          <h3 class="text-sm font-medium text-[color:var(--color-fg)] mb-3">Redshift hours</h3>
          <div class="space-y-4">
            <div>
              <label class="ui-label flex justify-between">
                <span>Start</span>
                <span class="tabular-nums text-[color:var(--color-fg-muted)]">{{
                  formatHour(localRedshiftStart)
                }}</span>
              </label>
              <input
                v-model.number="localRedshiftStart"
                type="range"
                min="18"
                max="23"
                step="0.5"
                class="ui-range"
                @change="updateRedshiftSettings"
              />
            </div>
            <div>
              <label class="ui-label flex justify-between">
                <span>End</span>
                <span class="tabular-nums text-[color:var(--color-fg-muted)]">{{
                  formatHour(localRedshiftEnd)
                }}</span>
              </label>
              <input
                v-model.number="localRedshiftEnd"
                type="range"
                min="4"
                max="10"
                step="0.5"
                class="ui-range"
                @change="updateRedshiftSettings"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About theme levels -->
    <section class="ui-card">
      <header class="ui-card-header">
        <h2 class="ui-card-title">About theme levels</h2>
      </header>
      <div class="ui-card-body space-y-4">
        <div class="flex items-start gap-3">
          <div class="mt-1.5 h-2 w-2 rounded-full bg-[color:var(--color-warning)]" />
          <div>
            <h3 class="text-sm font-medium text-[color:var(--color-fg)]">Normal</h3>
            <p class="text-xs text-[color:var(--color-fg-muted)] leading-relaxed">
              Light theme used during daytime hours (sunrise to sunset).
            </p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="mt-1.5 h-2 w-2 rounded-full bg-[color:var(--color-brand-600)]" />
          <div>
            <h3 class="text-sm font-medium text-[color:var(--color-fg)]">Dark</h3>
            <p class="text-xs text-[color:var(--color-fg-muted)] leading-relaxed">
              Used during evening hours. Reduces eye strain in low light.
            </p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="mt-1.5 h-2 w-2 rounded-full bg-[color:var(--color-danger)]" />
          <div>
            <h3 class="text-sm font-medium text-[color:var(--color-fg)]">Redshift</h3>
            <p class="text-xs text-[color:var(--color-fg-muted)] leading-relaxed">
              Dark theme with a red filter for late-night hours. Reduces blue light.
            </p>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
