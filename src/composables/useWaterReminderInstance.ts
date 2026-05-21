import { ref, computed } from 'vue';
import { useWidgetSettingsStore } from '../stores/widgetSettings';
import type { WaterReminderData, WaterReminder, WaterReminderSettings } from '../stores/types';

const defaultSettings = (): WaterReminderSettings => ({
  weight: 175,
  dailyGoal: 0,
  reminderInterval: 2,
  startTime: '08:00',
  endTime: '22:00',
});

const defaultData = (): WaterReminderData => ({
  settings: defaultSettings(),
  reminders: [],
  lastResetDate: '',
});

export function useWaterReminderInstance(widgetId: string) {
  const widgetSettingsStore = useWidgetSettingsStore();
  const data = ref<WaterReminderData>(defaultData());
  const error = ref<string | null>(null);

  const calculateDailyGoal = (weight: number) => Math.round(weight * 0.67);

  const generateId = () => Date.now().toString() + Math.random().toString(36).slice(2, 11);

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

  const persist = () => {
    try {
      widgetSettingsStore.setWaterReminderData(widgetId, data.value);
      error.value = null;
    } catch (err) {
      console.error('Failed to save water reminder data:', err);
      error.value = 'Failed to save data';
    }
  };

  const resetDailyProgress = () => {
    const today = new Date().toISOString().split('T')[0];
    data.value.reminders = generateReminders(data.value.settings);
    data.value.lastResetDate = today;
    persist();
  };

  const initialize = () => {
    const stored = widgetSettingsStore.getWaterReminderData(widgetId);
    if (stored) {
      data.value = stored;
      const today = new Date().toISOString().split('T')[0];
      if (data.value.lastResetDate !== today) {
        resetDailyProgress();
      }
      return;
    }

    updateSettings(data.value.settings);
  };

  const updateSettings = (newSettings: Partial<WaterReminderSettings>) => {
    const updatedSettings = { ...data.value.settings, ...newSettings };

    if (newSettings.weight) {
      updatedSettings.dailyGoal = calculateDailyGoal(newSettings.weight);
    }

    data.value.settings = updatedSettings;

    const today = new Date().toISOString().split('T')[0];
    data.value.reminders = generateReminders(updatedSettings);
    data.value.lastResetDate = today;

    persist();
  };

  const completeReminder = (reminderId: string) => {
    const reminder = data.value.reminders.find(r => r.id === reminderId);
    if (reminder && !reminder.completed) {
      reminder.completed = true;
      reminder.completedAt = Date.now();
      persist();
    }
  };

  const uncompleteReminder = (reminderId: string) => {
    const reminder = data.value.reminders.find(r => r.id === reminderId);
    if (reminder?.completed) {
      reminder.completed = false;
      reminder.completedAt = undefined;
      persist();
    }
  };

  const todayCompletedOunces = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    if (data.value.lastResetDate !== today) return 0;
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

  return {
    data,
    error,
    todayCompletedOunces,
    completionPercentage,
    nextReminder,
    overdueReminders,
    initialize,
    updateSettings,
    completeReminder,
    uncompleteReminder,
    resetDailyProgress,
  };
}
