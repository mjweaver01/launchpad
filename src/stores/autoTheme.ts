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

export const useAutoThemeStore = defineStore('autoTheme', () => {
  const darkModeStore = useDarkModeStore();
  const redHueStore = useRedHueStore();
  const locationStore = useLocationStore();

  // State
  const isAutoThemeEnabled = ref(false);
  const currentThemeLevel = ref<ThemeLevel>('normal');
  const manualOverride = ref<ThemeLevel | null>(null);
  const redshiftStartHour = ref(22); // 10 PM default
  const redshiftEndHour = ref(6); // 6 AM default

  let updateInterval: number | null = null;

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
  const getCurrentHour = (): number => {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  };

  const determineThemeLevel = (): ThemeLevel => {
    const currentHour = getCurrentHour();
    const schedule = themeSchedule.value;

    // Handle redshift time (can cross midnight)
    if (redshiftStartHour.value > redshiftEndHour.value) {
      // Crosses midnight (e.g., 22:00 to 06:00)
      if (currentHour >= redshiftStartHour.value || currentHour < redshiftEndHour.value) {
        return 'redshift';
      }
    } else {
      // Same day (e.g., 02:00 to 06:00)
      if (currentHour >= redshiftStartHour.value && currentHour < redshiftEndHour.value) {
        return 'redshift';
      }
    }

    // Check for dark mode time
    if (currentHour >= schedule.dark.start || currentHour < schedule.normal.start) {
      return 'dark';
    }

    // Default to normal (daylight)
    return 'normal';
  };

  const applyThemeLevel = (level: ThemeLevel) => {
    console.log(`Applying theme level: ${level}`);

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

  const updateTheme = () => {
    if (!isAutoThemeEnabled.value) return;

    const newLevel = determineThemeLevel();
    if (newLevel !== currentThemeLevel.value && !manualOverride.value) {
      applyThemeLevel(newLevel);
    }
  };

  const enableAutoTheme = () => {
    isAutoThemeEnabled.value = true;
    localStorage.setItem('autoThemeEnabled', 'true');

    // Apply theme immediately
    updateTheme();

    // Set up periodic updates (every minute)
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    updateInterval = setInterval(updateTheme, 60000);

    console.log('Auto-theme enabled');
  };

  const disableAutoTheme = () => {
    isAutoThemeEnabled.value = false;
    manualOverride.value = null;
    localStorage.setItem('autoThemeEnabled', 'false');

    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }

    console.log('Auto-theme disabled');
  };

  const toggleAutoTheme = () => {
    if (isAutoThemeEnabled.value) {
      disableAutoTheme();
    } else {
      enableAutoTheme();
    }
  };

  const setManualOverride = (level: ThemeLevel | null) => {
    manualOverride.value = level;
    if (level) {
      applyThemeLevel(level);
      localStorage.setItem('themeManualOverride', level);
    } else {
      localStorage.removeItem('themeManualOverride');
      updateTheme(); // Apply automatic theme
    }
  };

  const updateRedshiftTimes = (startHour: number, endHour: number) => {
    redshiftStartHour.value = startHour;
    redshiftEndHour.value = endHour;
    localStorage.setItem('redshiftStartHour', startHour.toString());
    localStorage.setItem('redshiftEndHour', endHour.toString());

    if (isAutoThemeEnabled.value) {
      updateTheme();
    }
  };

  const initializeAutoTheme = () => {
    // Load settings from localStorage
    const autoEnabled = localStorage.getItem('autoThemeEnabled');
    const savedOverride = localStorage.getItem('themeManualOverride');
    const savedStartHour = localStorage.getItem('redshiftStartHour');
    const savedEndHour = localStorage.getItem('redshiftEndHour');

    if (autoEnabled === 'true') {
      isAutoThemeEnabled.value = true;
    }

    if (savedOverride && ['normal', 'dark', 'redshift'].includes(savedOverride)) {
      manualOverride.value = savedOverride as ThemeLevel;
    }

    if (savedStartHour) {
      redshiftStartHour.value = parseInt(savedStartHour, 10);
    }

    if (savedEndHour) {
      redshiftEndHour.value = parseInt(savedEndHour, 10);
    }

    // If auto-theme is enabled, start the system
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
