<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { Sun, Moon, Wand2 } from 'lucide-vue-next';
import { useAutoThemeStore, type ThemeLevel } from '../stores/autoTheme';
import { useDarkModeStore } from '../stores/darkMode';
import { useRedHueStore } from '../stores/redHue';
import { useAppFontStore } from '../stores/appFont';
import { fontSelectOptions, type FontId } from '../assets/fonts';
import UiToggle from './ui/UiToggle.vue';
import UiButton from './ui/UiButton.vue';
import UiSelect from './ui/UiSelect.vue';

/** Theme controls shown in the header and full screen theme popups. */
const autoThemeStore = useAutoThemeStore();
const darkModeStore = useDarkModeStore();
const redHueStore = useRedHueStore();
const appFontStore = useAppFontStore();

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

const LEVEL_LABELS: Record<ThemeLevel, string> = {
  normal: 'Light',
  dark: 'Dark',
  redshift: 'Red shift',
};
const themeOptions: ThemeLevel[] = ['normal', 'dark', 'redshift'];

// Re-evaluate time-based labels while the popup is open.
const now = ref(Date.now());
let tick: ReturnType<typeof setInterval> | null = null;
onMounted(() => (tick = setInterval(() => (now.value = Date.now()), 30_000)));
onUnmounted(() => tick && clearInterval(tick));

const formatHour = (hour: number) => {
  const wholeHour = Math.floor(hour);
  const minutes = Math.round((hour - wholeHour) * 60);
  const period = wholeHour >= 12 ? 'PM' : 'AM';
  const display = wholeHour > 12 ? wholeHour - 12 : wholeHour === 0 ? 12 : wholeHour;
  return `${display}:${String(minutes).padStart(2, '0')} ${period}`;
};

const status = computed(() => {
  void now.value;
  const label = LEVEL_LABELS[autoThemeStore.effectiveThemeLevel];
  const at = autoThemeStore.overrideExpiresAt;
  if (autoThemeStore.manualOverride && at !== null) {
    const until = new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${label} until ${until}, then back to the schedule`;
  }
  return `${label} now, following the schedule`;
});

const setOverride = (level: ThemeLevel) =>
  autoThemeStore.setManualOverride(autoThemeStore.manualOverride === level ? null : level);

const localStart = ref(autoThemeStore.redshiftStartHour);
const localEnd = ref(autoThemeStore.redshiftEndHour);
watch(
  () => autoThemeStore.redshiftStartHour,
  v => (localStart.value = v)
);
watch(
  () => autoThemeStore.redshiftEndHour,
  v => (localEnd.value = v)
);
const saveRedshiftHours = () =>
  autoThemeStore.updateRedshiftTimes(localStart.value, localEnd.value);
</script>

<template>
  <div class="space-y-4">
    <UiSelect
      id="app-font"
      label="Font"
      :model-value="appFontStore.fontId"
      :options="fontSelectOptions"
      @change="v => appFontStore.setFont(v as FontId)"
    />
    <UiToggle v-model="isDarkMode" label="Dark mode" :icon-off="Sun" :icon-on="Moon" />
    <UiToggle v-model="isRedHue" label="Red shift" description="Filter blue light at night" />
    <UiToggle
      v-model="isAutoTheme"
      label="Auto"
      description="Switch by time of day"
      :icon-on="Wand2"
      :icon-off="Wand2"
    />

    <template v-if="autoThemeStore.isAutoThemeEnabled">
      <div class="border-t border-border pt-4 space-y-4">
        <p class="text-xs text-fg-muted">{{ status }}</p>

        <div class="rounded-lg border border-border divide-y divide-border text-sm">
          <div class="flex justify-between items-center px-3 py-2">
            <span class="text-fg-muted">Light</span>
            <span class="text-fg tabular-nums">
              {{ formatHour(autoThemeStore.sunTimes.sunrise) }} –
              {{ formatHour(autoThemeStore.sunTimes.sunset) }}
            </span>
          </div>
          <div class="flex justify-between items-center px-3 py-2">
            <span class="text-fg-muted">Dark</span>
            <span class="text-fg tabular-nums">
              {{ formatHour(autoThemeStore.sunTimes.sunset) }} –
              {{ formatHour(autoThemeStore.redshiftStartHour) }}
            </span>
          </div>
          <div class="flex justify-between items-center px-3 py-2">
            <span class="text-fg-muted">Red shift</span>
            <span class="text-fg tabular-nums">
              {{ formatHour(autoThemeStore.redshiftStartHour) }} –
              {{ formatHour(autoThemeStore.redshiftEndHour) }}
            </span>
          </div>
        </div>
        <p class="text-xs text-fg-muted -mt-2">
          Light and dark follow sunrise and sunset. Red shift is dark plus a red filter.
        </p>

        <div>
          <h4 class="ui-label">Override for now</h4>
          <div class="grid grid-cols-3 gap-2">
            <UiButton
              v-for="level in themeOptions"
              :key="level"
              :variant="autoThemeStore.manualOverride === level ? 'primary' : 'secondary'"
              size="sm"
              @click="setOverride(level)"
            >
              {{ LEVEL_LABELS[level] }}
            </UiButton>
          </div>
          <p class="text-xs text-fg-muted mt-1.5">Lasts until the schedule next changes.</p>
        </div>

        <div class="space-y-3">
          <div>
            <label class="ui-label flex justify-between" for="redshift-start">
              <span>Red shift starts</span>
              <span class="tabular-nums text-fg-muted">{{ formatHour(localStart) }}</span>
            </label>
            <input
              id="redshift-start"
              v-model.number="localStart"
              type="range"
              min="18"
              max="23"
              step="0.5"
              class="ui-range"
              @change="saveRedshiftHours"
            />
          </div>
          <div>
            <label class="ui-label flex justify-between" for="redshift-end">
              <span>Red shift ends</span>
              <span class="tabular-nums text-fg-muted">{{ formatHour(localEnd) }}</span>
            </label>
            <input
              id="redshift-end"
              v-model.number="localEnd"
              type="range"
              min="4"
              max="10"
              step="0.5"
              class="ui-range"
              @change="saveRedshiftHours"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
