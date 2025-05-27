<template>
  <div class="bg-white rounded-lg shadow-md p-6 w-full mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-gray-800">💧 Water Reminder</h2>
      <div class="flex items-center gap-2">
        <button
          @click="showSettings = !showSettings"
          class="p-2 text-gray-600 hover:text-blue-600 transition-colors flex items-center justify-center"
          title="Settings"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
        <ExpandWidget widgetName="water" displayName="Water Reminder" />
      </div>
    </div>

    <!-- Settings Panel -->
    <div v-if="showSettings" class="mb-6 p-4 bg-gray-50 rounded-lg">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Settings</h3>

      <!-- Weight Slider -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Weight: {{ localWeight }} lbs
        </label>
        <input
          v-model.number="localWeight"
          type="range"
          min="80"
          max="400"
          step="5"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          @input="updateWeight"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>80 lbs</span>
          <span>400 lbs</span>
        </div>
      </div>

      <!-- Daily Goal Display -->
      <div class="mb-4">
        <div class="text-sm text-gray-600">
          Daily Goal:
          <span class="font-semibold text-blue-600"
            >{{ waterStore.data.settings.dailyGoal }} oz</span
          >
        </div>
      </div>

      <!-- Time Settings -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
          <input
            v-model="localStartTime"
            type="time"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            @change="updateTimeSettings"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">End Time</label>
          <input
            v-model="localEndTime"
            type="time"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            @change="updateTimeSettings"
          />
        </div>
      </div>

      <!-- Reminder Interval -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Reminder Interval: {{ localInterval }} hours
        </label>
        <input
          v-model.number="localInterval"
          type="range"
          min="1"
          max="6"
          step="0.5"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          @input="updateInterval"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 hour</span>
          <span>6 hours</span>
        </div>
      </div>

      <button
        @click="showSettings = false"
        class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Done
      </button>
    </div>

    <!-- Error State -->
    <div v-if="waterStore.error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
      <p class="text-red-600 text-sm">{{ waterStore.error }}</p>
    </div>

    <!-- Progress Section -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-600">Daily Progress</span>
        <span class="text-sm text-gray-600">
          {{ waterStore.todayCompletedOunces }} / {{ waterStore.data.settings.dailyGoal }} oz
        </span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-3">
        <div
          class="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500"
          :style="{ width: `${waterStore.completionPercentage}%` }"
        ></div>
      </div>
      <div class="text-center mt-2">
        <span class="text-lg font-bold text-blue-600">{{ waterStore.completionPercentage }}%</span>
      </div>
    </div>

    <!-- Next Reminder -->
    <div
      v-if="waterStore.nextReminder"
      class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
    >
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div>
          <div class="font-medium text-gray-800">Next Reminder</div>
          <div class="text-sm text-gray-600">
            {{ waterStore.nextReminder.time }} - Drink {{ waterStore.nextReminder.amount }} oz
          </div>
        </div>
      </div>
    </div>

    <!-- Overdue Reminders Alert -->
    <div
      v-if="waterStore.overdueReminders.length > 0"
      class="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg"
    >
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div>
          <div class="font-medium text-gray-800">Missed Reminders</div>
          <div class="text-sm text-gray-600">
            You have {{ waterStore.overdueReminders.length }} overdue reminder{{
              waterStore.overdueReminders.length > 1 ? 's' : ''
            }}
          </div>
        </div>
      </div>
    </div>

    <!-- Reminders List -->
    <div class="space-y-3 max-h-[400px] overflow-y-auto">
      <h3 class="text-lg font-semibold text-gray-800 mb-3">Today's Reminders</h3>

      <!-- Empty state -->
      <div v-if="waterStore.data.reminders.length === 0" class="text-center py-8 text-gray-500">
        <svg
          class="w-12 h-12 mx-auto mb-3 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l4 2" />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
          />
        </svg>
        <p class="text-sm">Configure your settings to start getting reminders!</p>
      </div>

      <!-- Reminder items -->
      <div
        v-for="reminder in sortedReminders"
        :key="reminder.id"
        class="flex items-center gap-3 p-3 rounded-lg border transition-colors"
        :class="[
          reminder.completed
            ? 'bg-green-50 border-green-200'
            : isOverdue(reminder.time)
              ? 'bg-orange-50 border-orange-200'
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100',
        ]"
      >
        <!-- Water Drop Icon / Checkbox -->
        <button
          @click="toggleReminder(reminder)"
          class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          :class="
            reminder.completed
              ? 'bg-green-500 text-white'
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          "
        >
          <svg v-if="reminder.completed" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 2a6 6 0 00-6 6c0 4.314 6 10 6 10s6-5.686 6-10a6 6 0 00-6-6z"
              clip-rule="evenodd"
            />
          </svg>
        </button>

        <!-- Reminder Details -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span
              class="font-medium"
              :class="[reminder.completed ? 'text-green-600' : 'text-gray-800']"
            >
              {{ reminder.time }}
            </span>
            <span
              class="text-sm px-2 py-1 rounded-full"
              :class="[
                reminder.completed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600',
              ]"
            >
              {{ reminder.amount }} oz
            </span>
          </div>
          <div v-if="reminder.completed && reminder.completedAt" class="text-xs text-gray-500">
            Completed {{ formatTime(reminder.completedAt) }}
          </div>
        </div>

        <!-- Status Badge -->
        <div class="flex-shrink-0">
          <span
            v-if="reminder.completed"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
          >
            Done
          </span>
          <span
            v-else-if="isOverdue(reminder.time)"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
          >
            Overdue
          </span>
          <span
            v-else
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
          >
            Pending
          </span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div v-if="waterStore.data.reminders.length > 0" class="mt-6 flex gap-2">
      <button
        @click="resetDailyProgress"
        class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
      >
        Reset Day
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useWaterReminderStore } from '../stores';
import type { WaterReminder } from '../stores/types';
import ExpandWidget from './ExpandWidget.vue';

export default defineComponent({
  name: 'WaterReminderWidget',
  components: {
    ExpandWidget,
  },
  setup() {
    const waterStore = useWaterReminderStore();
    const showSettings = ref(false);

    // Local state for settings form
    const localWeight = ref(175);
    const localStartTime = ref('08:00');
    const localEndTime = ref('22:00');
    const localInterval = ref(2);

    // Sort reminders: overdue first, then pending by time, then completed
    const sortedReminders = computed(() => {
      const reminders = [...waterStore.data.reminders];
      return reminders.sort((a, b) => {
        // First, sort by completion status
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        // If both are incomplete, sort overdue first
        if (!a.completed && !b.completed) {
          const aOverdue = isOverdue(a.time);
          const bOverdue = isOverdue(b.time);
          if (aOverdue !== bOverdue) {
            return aOverdue ? -1 : 1;
          }
        }

        // Finally, sort by time
        return a.time.localeCompare(b.time);
      });
    });

    const isOverdue = (time: string): boolean => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      return time < currentTime;
    };

    const formatTime = (timestamp: number): string => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    const updateWeight = () => {
      waterStore.updateSettings({ weight: localWeight.value });
    };

    const updateTimeSettings = () => {
      waterStore.updateSettings({
        startTime: localStartTime.value,
        endTime: localEndTime.value,
      });
    };

    const updateInterval = () => {
      waterStore.updateSettings({ reminderInterval: localInterval.value });
    };

    const toggleReminder = (reminder: WaterReminder) => {
      if (reminder.completed) {
        waterStore.uncompleteReminder(reminder.id);
      } else {
        waterStore.completeReminder(reminder.id);
      }
    };

    const resetDailyProgress = () => {
      if (
        confirm(
          "Are you sure you want to reset today's progress? This will mark all reminders as incomplete."
        )
      ) {
        waterStore.resetDailyProgress();
      }
    };

    // Initialize local state from store
    const syncLocalState = () => {
      localWeight.value = waterStore.data.settings.weight;
      localStartTime.value = waterStore.data.settings.startTime;
      localEndTime.value = waterStore.data.settings.endTime;
      localInterval.value = waterStore.data.settings.reminderInterval;
    };

    onMounted(() => {
      waterStore.initializeFromStorage();
      syncLocalState();
    });

    return {
      waterStore,
      showSettings,
      localWeight,
      localStartTime,
      localEndTime,
      localInterval,
      sortedReminders,
      isOverdue,
      formatTime,
      updateWeight,
      updateTimeSettings,
      updateInterval,
      toggleReminder,
      resetDailyProgress,
    };
  },
});
</script>

<style scoped>
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #4f46e5;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #4f46e5;
  cursor: pointer;
  border: none;
}
</style>
