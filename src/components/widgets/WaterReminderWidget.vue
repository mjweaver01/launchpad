<template>
  <div
    class="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full mx-auto transition-colors duration-200"
  >
    <div v-if="$route.name !== 'Full Screen'" class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200">💧 Water Reminder</h2>
      <div class="flex items-center gap-2">
        <button
          @click="showSettings = !showSettings"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center"
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

    <div class="h-full overflow-y-auto">
      <!-- Settings Panel -->
      <div v-if="showSettings" class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Settings</h3>

        <!-- Weight Slider -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Weight: {{ localWeight }} lbs
          </label>
          <input
            v-model.number="localWeight"
            type="range"
            min="80"
            max="400"
            step="5"
            class="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            @input="updateWeight"
          />
          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>80 lbs</span>
            <span>400 lbs</span>
          </div>
        </div>

        <!-- Daily Goal Display -->
        <div class="mb-4">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Daily Goal:
            <span class="font-semibold text-blue-600 dark:text-blue-400"
              >{{ waterStore.data.settings.dailyGoal }} oz</span
            >
          </div>
        </div>

        <!-- Time Settings -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Start Time</label
            >
            <input
              v-model="localStartTime"
              type="time"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              @change="updateTimeSettings"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >End Time</label
            >
            <input
              v-model="localEndTime"
              type="time"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              @change="updateTimeSettings"
            />
          </div>
        </div>

        <!-- Reminder Interval -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reminder Interval: {{ localInterval }} hours
          </label>
          <input
            v-model.number="localInterval"
            type="range"
            min="1"
            max="6"
            step="0.5"
            class="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            @input="updateInterval"
          />
          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>1 hour</span>
            <span>6 hours</span>
          </div>
        </div>

        <button
          @click="showSettings = false"
          class="w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          Done
        </button>
      </div>

      <!-- Error State -->
      <div
        v-if="waterStore.error"
        class="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md"
      >
        <p class="text-red-600 dark:text-red-400 text-sm">{{ waterStore.error }}</p>
      </div>

      <!-- Progress Section -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
            >Daily Water Progress</span
          >
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ waterStore.todayCompletedOunces }} / {{ waterStore.data.settings.dailyGoal }} oz
          </span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            class="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500"
            :style="{ width: `${waterStore.completionPercentage}%` }"
          ></div>
        </div>
        <div class="text-center mt-2">
          <span class="text-lg font-bold text-blue-600 dark:text-blue-400"
            >{{ waterStore.completionPercentage }}%</span
          >
        </div>
      </div>

      <!-- Next Reminder -->
      <div
        v-if="waterStore.nextReminder"
        class="mb-6 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
        @click="toggleReminder(waterStore.nextReminder)"
      >
        <div class="flex items-center gap-3">
          <button
            class="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
            @click.stop="toggleReminder(waterStore.nextReminder)"
          >
            <svg
              class="w-6 h-6 text-blue-600 dark:text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 2a6 6 0 00-6 6c0 4.314 6 10 6 10s6-5.686 6-10a6 6 0 00-6-6z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          <div class="flex-1">
            <div class="font-medium text-gray-800 dark:text-gray-200">Next Reminder</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ waterStore.nextReminder.time }} - Drink {{ waterStore.nextReminder.amount }} oz
            </div>
          </div>
        </div>
      </div>

      <!-- Overdue Reminders Alert -->
      <div
        v-if="waterStore.overdueReminders.length > 0"
        class="mb-6 p-4 bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded-lg"
      >
        <div class="flex items-center gap-3">
          <button
            class="w-12 h-12 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center hover:bg-orange-200 dark:hover:bg-orange-700 transition-colors"
            @click="toggleReminder(waterStore.overdueReminders[0])"
            :title="`Complete first missed reminder (${waterStore.overdueReminders[0].time})`"
          >
            <svg
              class="w-6 h-6 text-orange-600 dark:text-orange-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 2a6 6 0 00-6 6c0 4.314 6 10 6 10s6-5.686 6-10a6 6 0 00-6-6z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          <div class="flex-1">
            <div class="font-medium text-gray-800 dark:text-gray-200">Missed Reminders</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              You have {{ waterStore.overdueReminders.length }} overdue reminder{{
                waterStore.overdueReminders.length > 1 ? 's' : ''
              }}
            </div>
            <div class="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Click water drop to complete oldest, or "Complete All" button
            </div>
          </div>
          <button
            v-if="waterStore.overdueReminders.length > 1"
            @click="completeAllOverdueReminders"
            class="px-3 py-1 bg-orange-600 dark:bg-orange-700 text-white text-xs rounded-md hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors"
          >
            Complete All ({{ waterStore.overdueReminders.length }})
          </button>
        </div>
      </div>

      <!-- Reminders List -->
      <div class="space-y-3 overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Today's Reminders
        </h3>

        <!-- Empty state -->
        <div
          v-if="waterStore.data.reminders.length === 0"
          class="text-center py-8 text-gray-500 dark:text-gray-400"
        >
          <svg
            class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600"
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
              ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700'
              : isOverdue(reminder.time)
                ? 'bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700'
                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600',
          ]"
        >
          <!-- Water Drop Icon / Checkbox -->
          <button
            @click="toggleReminder(reminder)"
            class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            :class="
              reminder.completed
                ? 'bg-green-500 text-white'
                : 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-700'
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
                :class="[
                  reminder.completed
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-800 dark:text-gray-200',
                ]"
              >
                {{ reminder.time }}
              </span>
              <span
                class="text-sm px-2 py-1 rounded-full"
                :class="[
                  reminder.completed
                    ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300'
                    : 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300',
                ]"
              >
                {{ reminder.amount }} oz
              </span>
            </div>
            <div
              v-if="reminder.completed && reminder.completedAt"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              Completed {{ formatTime(reminder.completedAt) }}
            </div>
          </div>

          <!-- Status Badge -->
          <div class="flex-shrink-0">
            <span
              v-if="reminder.completed"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200"
            >
              Done
            </span>
            <span
              v-else-if="isOverdue(reminder.time)"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200"
            >
              Overdue
            </span>
            <span
              v-else
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
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
          class="flex-1 px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-sm"
        >
          Reset Day
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useWaterReminderStore } from '../../stores';
import type { WaterReminder } from '../../stores/types';
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

    const completeAllOverdueReminders = () => {
      waterStore.overdueReminders.forEach(reminder => {
        if (!reminder.completed) {
          waterStore.completeReminder(reminder.id);
        }
      });
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
      completeAllOverdueReminders,
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

/* Dark mode slider styles */
.dark .slider::-webkit-slider-thumb {
  background: #6366f1;
}

.dark .slider::-moz-range-thumb {
  background: #6366f1;
}
</style>
