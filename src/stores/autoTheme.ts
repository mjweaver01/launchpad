import { defineStore } from 'pinia';
import { ref, computed, watch, onUnmounted } from 'vue';
import { useDarkModeStore } from './darkMode';
import { useRedHueStore } from './redHue';
import { useLocationStore } from './location';

// Sunset/sunrise calculation helper functions
function getSunTimes(lat: number, lon: number, date: Date) {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const P = Math.asin(
    0.39795 * Math.cos(0.2163108 + 2 * Math.atan(Math.tan(0.0086 * (dayOfYear - 186))))
  );
  const argument = Math.sin(0.017453 * lat) * Math.sin(P) + Math.cos(0.017453 * lat) * Math.cos(P);
  const argument2 = Math.max(-1, Math.min(1, argument));
  const hourAngle = Math.acos(argument2);
  const decimalHours = 12 - (hourAngle * 180) / Math.PI / 15;
  const sunrise = decimalHours - lon / 15;
  const sunset = 24 - decimalHours - lon / 15;

  return {
    sunrise: normalizeHour(sunrise),
    sunset: normalizeHour(sunset),
  };
}

function normalizeHour(hour: number): number {
  while (hour < 0) hour += 24;
  while (hour >= 24) hour -= 24;
  return hour;
}

export type ThemeLevel = 'normal' | 'dark' | 'redshift';

const OVERRIDE_KEY = 'themeManualOverride';
const OVERRIDE_EXPIRES_KEY = 'themeManualOverrideExpiresAt';

export const useAutoThemeStore = defineStore('autoTheme', () => {
  const darkModeStore = useDarkModeStore();
  const redHueStore = useRedHueStore();
  const locationStore = useLocationStore();

  // State
  const isAutoThemeEnabled = ref(false);
  const currentThemeLevel = ref<ThemeLevel>('normal');
  const manualOverride = ref<ThemeLevel | null>(null);
  /** When the manual override ends (ms timestamp): the next scheduled change. */
  const overrideExpiresAt = ref<number | null>(null);
  const redshiftStartHour = ref(22); // 10 PM default
  const redshiftEndHour = ref(6); // 6 AM default

  let updateInterval: ReturnType<typeof setInterval> | null = null;

  // Computed
  const effectiveThemeLevel = computed(() => {
    return manualOverride.value || currentThemeLevel.value;
  });

  const sunTimes = computed(() => {
    const location = locationStore.currentLocation;
    if (!location?.coordinates) {
      // Default times if no location available
      return { sunrise: 6.5, sunset: 19.5 }; // 6:30 AM, 7:30 PM
    }

    const { lat, lon } = location.coordinates;
    return getSunTimes(lat, lon, new Date());
  });

  const themeSchedule = computed(() => {
    const { sunrise, sunset } = sunTimes.value;

    return {
      normal: { start: sunrise, end: sunset },
      dark: { start: sunset, end: redshiftStartHour.value },
      redshift: { start: redshiftStartHour.value, end: redshiftEndHour.value },
    };
  });

  // Actions
  const hourOf = (date: Date): number =>
    date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

  /** Scheduled theme level at a given hour of the day (0-24, fractional). */
  const levelAtHour = (hour: number): ThemeLevel => {
    const schedule = themeSchedule.value;

    // Handle redshift time (can cross midnight)
    if (redshiftStartHour.value > redshiftEndHour.value) {
      // Crosses midnight (e.g., 22:00 to 06:00)
      if (hour >= redshiftStartHour.value || hour < redshiftEndHour.value) {
        return 'redshift';
      }
    } else {
      // Same day (e.g., 02:00 to 06:00)
      if (hour >= redshiftStartHour.value && hour < redshiftEndHour.value) {
        return 'redshift';
      }
    }

    // Check for dark mode time
    if (hour >= schedule.dark.start || hour < schedule.normal.start) {
      return 'dark';
    }

    // Default to normal (daylight)
    return 'normal';
  };

  const determineThemeLevel = (): ThemeLevel => levelAtHour(hourOf(new Date()));

  /**
   * Timestamp of the next moment the scheduled level differs from the one in
   * effect at `from`. Used to expire a manual override at the next scheduled
   * change, so a late-night tap doesn't stick into the next day.
   */
  const nextScheduleChange = (from: Date): number => {
    const startLevel = levelAtHour(hourOf(from));
    const { sunrise, sunset } = sunTimes.value;
    const boundaries = [sunrise, sunset, redshiftStartHour.value, redshiftEndHour.value];

    const candidates = boundaries
      .map(hour => {
        const at = new Date(from);
        at.setHours(0, Math.round(hour * 60), 0, 0);
        if (at <= from) at.setDate(at.getDate() + 1);
        return at;
      })
      .sort((a, b) => a.getTime() - b.getTime());

    for (const at of candidates) {
      // Check a minute past the boundary to avoid rounding at the edge.
      if (levelAtHour(hourOf(new Date(at.getTime() + 60_000))) !== startLevel) {
        return at.getTime();
      }
    }
    return from.getTime() + 24 * 60 * 60 * 1000;
  };

  const applyThemeLevel = (level: ThemeLevel) => {
    switch (level) {
      case 'normal':
        if (darkModeStore.isDarkMode) {
          darkModeStore.toggleDarkMode();
        }
        if (redHueStore.isRedHue) {
          redHueStore.toggleRedHue();
        }
        break;

      case 'dark':
        if (!darkModeStore.isDarkMode) {
          darkModeStore.toggleDarkMode();
        }
        if (redHueStore.isRedHue) {
          redHueStore.toggleRedHue();
        }
        break;

      case 'redshift':
        if (!darkModeStore.isDarkMode) {
          darkModeStore.toggleDarkMode();
        }
        if (!redHueStore.isRedHue) {
          redHueStore.toggleRedHue();
        }
        break;
    }

    currentThemeLevel.value = level;
  };

  const persistOverride = () => {
    if (manualOverride.value && overrideExpiresAt.value !== null) {
      localStorage.setItem(OVERRIDE_KEY, manualOverride.value);
      localStorage.setItem(OVERRIDE_EXPIRES_KEY, String(overrideExpiresAt.value));
    } else {
      localStorage.removeItem(OVERRIDE_KEY);
      localStorage.removeItem(OVERRIDE_EXPIRES_KEY);
    }
  };

  const clearOverride = () => {
    manualOverride.value = null;
    overrideExpiresAt.value = null;
    persistOverride();
  };

  /**
   * Apply the scheduled level (or an unexpired manual override).
   * `force` applies it even when the level hasn't changed. That matters at
   * startup: dark mode and red shift are restored from storage as they were
   * last session, while currentThemeLevel starts at 'normal', so without
   * forcing, last night's red shift would stay on all day.
   */
  const updateTheme = (force = false) => {
    if (!isAutoThemeEnabled.value) return;

    if (
      manualOverride.value &&
      overrideExpiresAt.value !== null &&
      Date.now() >= overrideExpiresAt.value
    ) {
      clearOverride();
      force = true;
    }

    const level = manualOverride.value ?? determineThemeLevel();
    if (force || level !== currentThemeLevel.value) {
      applyThemeLevel(level);
    }
  };

  const enableAutoTheme = () => {
    isAutoThemeEnabled.value = true;
    localStorage.setItem('autoThemeEnabled', 'true');

    // Apply theme immediately, even if the level looks unchanged
    updateTheme(true);

    // Set up periodic updates (every minute)
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    updateInterval = setInterval(() => updateTheme(), 60000);
  };

  const disableAutoTheme = () => {
    isAutoThemeEnabled.value = false;
    clearOverride();
    localStorage.setItem('autoThemeEnabled', 'false');

    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  };

  const toggleAutoTheme = () => {
    if (isAutoThemeEnabled.value) {
      disableAutoTheme();
    } else {
      enableAutoTheme();
    }
  };

  /** Set a manual override that lasts until the next scheduled change. */
  const setManualOverride = (level: ThemeLevel | null) => {
    if (level) {
      manualOverride.value = level;
      overrideExpiresAt.value = nextScheduleChange(new Date());
      persistOverride();
      applyThemeLevel(level);
    } else {
      clearOverride();
      updateTheme(true);
    }
  };

  const updateRedshiftTimes = (startHour: number, endHour: number) => {
    redshiftStartHour.value = startHour;
    redshiftEndHour.value = endHour;
    localStorage.setItem('redshiftStartHour', startHour.toString());
    localStorage.setItem('redshiftEndHour', endHour.toString());

    // The schedule moved, so an active override ends at the new next change.
    if (manualOverride.value) {
      overrideExpiresAt.value = nextScheduleChange(new Date());
      persistOverride();
    }

    if (isAutoThemeEnabled.value) {
      updateTheme();
    }
  };

  const readHour = (key: string, fallback: number): number => {
    const value = parseFloat(localStorage.getItem(key) ?? '');
    return Number.isFinite(value) && value >= 0 && value < 24 ? value : fallback;
  };

  const initializeAutoTheme = () => {
    // Load settings from localStorage
    isAutoThemeEnabled.value = localStorage.getItem('autoThemeEnabled') === 'true';

    // parseFloat, not parseInt: the sliders step in half hours (21.5 = 9:30 PM)
    redshiftStartHour.value = readHour('redshiftStartHour', 22);
    redshiftEndHour.value = readHour('redshiftEndHour', 6);

    const savedOverride = localStorage.getItem(OVERRIDE_KEY);
    if (savedOverride && ['normal', 'dark', 'redshift'].includes(savedOverride)) {
      manualOverride.value = savedOverride as ThemeLevel;
      const savedExpiry = Number(localStorage.getItem(OVERRIDE_EXPIRES_KEY));
      // Overrides saved before expiry existed get one now, ending at the next change.
      overrideExpiresAt.value =
        Number.isFinite(savedExpiry) && savedExpiry > 0
          ? savedExpiry
          : nextScheduleChange(new Date());
      persistOverride();
    }

    // If auto-theme is enabled, start the system (expired overrides clear here)
    if (isAutoThemeEnabled.value) {
      enableAutoTheme();
    }
  };

  // Cleanup function
  const cleanup = () => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  };

  // Watch for location changes to update sun times
  watch(
    () => locationStore.currentLocation,
    () => {
      if (isAutoThemeEnabled.value) {
        updateTheme();
      }
    }
  );

  return {
    // State
    isAutoThemeEnabled,
    currentThemeLevel,
    effectiveThemeLevel,
    manualOverride,
    overrideExpiresAt,
    redshiftStartHour,
    redshiftEndHour,

    // Computed
    sunTimes,
    themeSchedule,

    // Actions
    enableAutoTheme,
    disableAutoTheme,
    toggleAutoTheme,
    setManualOverride,
    updateRedshiftTimes,
    initializeAutoTheme,
    updateTheme,
    cleanup,
  };
});
