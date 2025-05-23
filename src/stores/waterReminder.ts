import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { CacheStorage } from './storage';
import type { WaterReminderData, WaterReminder, WaterReminderSettings } from './types';
import { WATER_REMINDER_CACHE_DURATION } from './types';

const STORAGE_KEY = 'water-reminder-data';

export const useWaterReminderStore = defineStore('waterReminder', () => {
  // State
  const data = ref<WaterReminderData>({
    settings: {
      weight: 175, // Default weight in pounds
      dailyGoal: 0, // Will be calculated based on weight
      reminderInterval: 2, // Every 2 hours
      startTime: '08:00',
      endTime: '22:00',
    },
    reminders: [],
    lastResetDate: '',
  });

  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const todayCompletedOunces = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    if (data.value.lastResetDate !== today) {
      return 0;
    }
    return data.value.reminders
      .filter(reminder => reminder.completed)
      .reduce((total, reminder) => total + reminder.amount, 0);
  });

  const completionPercentage = computed(() => {
    if (data.value.settings.dailyGoal === 0) return 0;
    return Math.min(
      100,
      Math.round((todayCompletedOunces.value / data.value.settings.dailyGoal) * 100)
    );
  });

  const nextReminder = computed(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return data.value.reminders.find(
      reminder => !reminder.completed && reminder.time >= currentTime
    );
  });

  const overdueReminders = computed(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return data.value.reminders.filter(
      reminder => !reminder.completed && reminder.time < currentTime
    );
  });

  // Helper functions
  const calculateDailyGoal = (weight: number): number => {
    // Formula: weight (lbs) * 0.5 to 1 ounce per pound (we'll use 0.67 as a middle ground)
    return Math.round(weight * 0.67);
  };

  const generateId = (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const generateReminders = (settings: WaterReminderSettings): WaterReminder[] => {
    const reminders: WaterReminder[] = [];
    const startHour = parseInt(settings.startTime.split(':')[0]);
    const startMinute = parseInt(settings.startTime.split(':')[1]);
    const endHour = parseInt(settings.endTime.split(':')[0]);
    const endMinute = parseInt(settings.endTime.split(':')[1]);

    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;
    const intervalMinutes = settings.reminderInterval * 60;

    const amountPerReminder = Math.ceil(
      settings.dailyGoal / Math.ceil((endTimeMinutes - startTimeMinutes) / intervalMinutes)
    );

    for (let time = startTimeMinutes; time < endTimeMinutes; time += intervalMinutes) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      reminders.push({
        id: generateId(),
        time: timeString,
        amount: amountPerReminder,
        completed: false,
      });
    }

    return reminders;
  };

  // Actions
  const initializeFromStorage = () => {
    try {
      const cached = CacheStorage.get<WaterReminderData>(STORAGE_KEY);
      if (cached) {
        data.value = cached.data;

        // Check if we need to reset for a new day
        const today = new Date().toISOString().split('T')[0];
        if (data.value.lastResetDate !== today) {
          resetDailyProgress();
        }
      } else {
        // Initialize with default settings
        updateSettings(data.value.settings);
      }
    } catch (err) {
      console.error('Failed to load water reminder data from storage:', err);
      error.value = 'Failed to load saved data';
    }
  };

  const updateSettings = (newSettings: Partial<WaterReminderSettings>) => {
    try {
      const updatedSettings = { ...data.value.settings, ...newSettings };

      // Recalculate daily goal if weight changed
      if (newSettings.weight) {
        updatedSettings.dailyGoal = calculateDailyGoal(newSettings.weight);
      }

      data.value.settings = updatedSettings;

      // Regenerate reminders with new settings
      const today = new Date().toISOString().split('T')[0];
      data.value.reminders = generateReminders(updatedSettings);
      data.value.lastResetDate = today;

      saveToStorage();
      error.value = null;
    } catch (err) {
      console.error('Failed to update settings:', err);
      error.value = 'Failed to update settings';
    }
  };

  const completeReminder = (reminderId: string) => {
    try {
      const reminder = data.value.reminders.find(r => r.id === reminderId);
      if (reminder && !reminder.completed) {
        reminder.completed = true;
        reminder.completedAt = Date.now();
        saveToStorage();
        error.value = null;
      }
    } catch (err) {
      console.error('Failed to complete reminder:', err);
      error.value = 'Failed to complete reminder';
    }
  };

  const uncompleteReminder = (reminderId: string) => {
    try {
      const reminder = data.value.reminders.find(r => r.id === reminderId);
      if (reminder && reminder.completed) {
        reminder.completed = false;
        reminder.completedAt = undefined;
        saveToStorage();
        error.value = null;
      }
    } catch (err) {
      console.error('Failed to uncomplete reminder:', err);
      error.value = 'Failed to uncomplete reminder';
    }
  };

  const resetDailyProgress = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      data.value.reminders = generateReminders(data.value.settings);
      data.value.lastResetDate = today;
      saveToStorage();
      error.value = null;
    } catch (err) {
      console.error('Failed to reset daily progress:', err);
      error.value = 'Failed to reset daily progress';
    }
  };

  const saveToStorage = () => {
    try {
      CacheStorage.set(STORAGE_KEY, {
        data: data.value,
        timestamp: Date.now(),
        expiresAt: Date.now() + WATER_REMINDER_CACHE_DURATION,
      });
    } catch (err) {
      console.error('Failed to save water reminder data to storage:', err);
      error.value = 'Failed to save data';
    }
  };

  return {
    // State
    data: computed(() => data.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    // Computed
    todayCompletedOunces,
    completionPercentage,
    nextReminder,
    overdueReminders,

    // Actions
    initializeFromStorage,
    updateSettings,
    completeReminder,
    uncompleteReminder,
    resetDailyProgress,
  };
});
