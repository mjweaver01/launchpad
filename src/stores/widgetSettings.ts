import { defineStore } from 'pinia';
import { ref } from 'vue';
import { CacheStorage } from './storage';
import type { WaterReminderData } from './types';

export type TimeClockMode = 'digital' | 'scoreboard' | 'analog';

export interface TimeWidgetSettings {
  clockMode: TimeClockMode;
}

export interface WidgetSettingsEntry {
  time?: TimeWidgetSettings;
  waterReminder?: WaterReminderData;
}

const STORAGE_KEY = 'widget-instance-settings';
const LEGACY_TIME_KEY = 'timeWidget-clockMode';
const LEGACY_TIME_ANALOG_KEY = 'timeWidget-analogClock';
const LEGACY_WATER_KEY = 'water-reminder-data';

const defaultTimeSettings = (): TimeWidgetSettings => ({ clockMode: 'digital' });

export const useWidgetSettingsStore = defineStore('widgetSettings', () => {
  const byWidgetId = ref<Record<string, WidgetSettingsEntry>>({});

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(byWidgetId.value));
    } catch (error) {
      console.error('Failed to save widget instance settings:', error);
    }
  };

  const load = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      byWidgetId.value = stored ? (JSON.parse(stored) as Record<string, WidgetSettingsEntry>) : {};
    } catch (error) {
      console.error('Failed to load widget instance settings:', error);
      byWidgetId.value = {};
    }
  };

  const getEntry = (widgetId: string): WidgetSettingsEntry => {
    if (!byWidgetId.value[widgetId]) {
      byWidgetId.value[widgetId] = {};
    }
    return byWidgetId.value[widgetId];
  };

  const getTimeSettings = (widgetId: string): TimeWidgetSettings => {
    const existing = getEntry(widgetId).time;
    if (existing) return existing;

    const migrated = migrateLegacyTimeSettings(widgetId);
    if (migrated) {
      getEntry(widgetId).time = migrated;
      persist();
      return migrated;
    }

    return defaultTimeSettings();
  };

  const setTimeSettings = (widgetId: string, settings: Partial<TimeWidgetSettings>) => {
    const entry = getEntry(widgetId);
    entry.time = { ...defaultTimeSettings(), ...entry.time, ...settings };
    persist();
  };

  const getWaterReminderData = (widgetId: string): WaterReminderData | null => {
    const existing = getEntry(widgetId).waterReminder;
    if (existing) return structuredClone(existing);

    const migrated = migrateLegacyWaterSettings(widgetId);
    if (migrated) {
      getEntry(widgetId).waterReminder = migrated;
      persist();
      return structuredClone(migrated);
    }

    return null;
  };

  const setWaterReminderData = (widgetId: string, data: WaterReminderData) => {
    getEntry(widgetId).waterReminder = structuredClone(data);
    persist();
  };

  const copySettings = (fromWidgetId: string, toWidgetId: string) => {
    const source = byWidgetId.value[fromWidgetId];
    if (!source) return;
    byWidgetId.value[toWidgetId] = structuredClone(source);
    persist();
  };

  const removeWidgetSettings = (widgetId: string) => {
    if (!byWidgetId.value[widgetId]) return;
    delete byWidgetId.value[widgetId];
    persist();
  };

  const pruneToWidgetIds = (keepIds: Set<string>) => {
    for (const id of Object.keys(byWidgetId.value)) {
      if (!keepIds.has(id)) {
        delete byWidgetId.value[id];
      }
    }
    persist();
  };

  const migrateLegacyTimeSettings = (widgetId: string): TimeWidgetSettings | null => {
    if (widgetId !== 'time') return null;

    try {
      const savedMode = localStorage.getItem(LEGACY_TIME_KEY);
      if (savedMode === 'digital' || savedMode === 'scoreboard' || savedMode === 'analog') {
        return { clockMode: savedMode };
      }

      const legacy = localStorage.getItem(LEGACY_TIME_ANALOG_KEY);
      if (legacy && JSON.parse(legacy)) {
        return { clockMode: 'analog' };
      }
    } catch (error) {
      console.warn('Failed to migrate legacy time widget settings:', error);
    }

    return null;
  };

  const migrateLegacyWaterSettings = (widgetId: string): WaterReminderData | null => {
    if (widgetId !== 'water-reminder') return null;

    try {
      const cached = CacheStorage.get<WaterReminderData>(LEGACY_WATER_KEY);
      if (cached?.data) {
        return cached.data;
      }
    } catch (error) {
      console.warn('Failed to migrate legacy water reminder settings:', error);
    }

    return null;
  };

  load();

  return {
    getTimeSettings,
    setTimeSettings,
    getWaterReminderData,
    setWaterReminderData,
    copySettings,
    removeWidgetSettings,
    pruneToWidgetIds,
  };
});
