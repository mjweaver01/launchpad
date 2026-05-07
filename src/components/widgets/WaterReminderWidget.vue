<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Droplet, Settings, Check, AlertCircle } from 'lucide-vue-next';
import { useWaterReminderStore } from '../../stores';
import type { WaterReminder } from '../../stores/types';
import WidgetCard from './WidgetCard.vue';
import IconButton from '../ui/IconButton.vue';
import UiButton from '../ui/UiButton.vue';
import UiPill from '../ui/UiPill.vue';
import EmptyState from '../ui/EmptyState.vue';

const waterStore = useWaterReminderStore();
const showSettings = ref(false);

const localWeight = ref(175);
const localStartTime = ref('08:00');
const localEndTime = ref('22:00');
const localInterval = ref(2);

const isOverdue = (time: string): boolean => {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return time < currentTime;
};

const sortedReminders = computed(() => {
  return [...waterStore.data.reminders].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (!a.completed && !b.completed) {
      const aOverdue = isOverdue(a.time);
      const bOverdue = isOverdue(b.time);
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    }
    return a.time.localeCompare(b.time);
  });
});

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

const updateWeight = () => waterStore.updateSettings({ weight: localWeight.value });
const updateTimeSettings = () =>
  waterStore.updateSettings({ startTime: localStartTime.value, endTime: localEndTime.value });
const updateInterval = () => waterStore.updateSettings({ reminderInterval: localInterval.value });

const toggleReminder = (reminder: WaterReminder) => {
  if (reminder.completed) waterStore.uncompleteReminder(reminder.id);
  else waterStore.completeReminder(reminder.id);
};

const completeAllOverdueReminders = () => {
  waterStore.overdueReminders.forEach(r => {
    if (!r.completed) waterStore.completeReminder(r.id);
  });
};

const resetDailyProgress = () => {
  if (confirm("Are you sure you want to reset today's progress?")) {
    waterStore.resetDailyProgress();
  }
};

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
</script>

<template>
  <WidgetCard title="Water" :icon="Droplet" widgetName="water" displayName="Water Reminder">
    <template #actions>
      <IconButton :icon="Settings" label="Settings" @click="showSettings = !showSettings" />
    </template>

    <!-- Settings Panel -->
    <Transition name="ui-collapse">
      <div
        v-if="showSettings"
        class="mb-5 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4"
      >
        <h3 class="text-sm font-semibold text-[color:var(--color-fg)] mb-3">Settings</h3>

        <div class="mb-4">
          <label class="ui-label">Weight: {{ localWeight }} lbs</label>
          <input
            v-model.number="localWeight"
            type="range"
            min="80"
            max="400"
            step="5"
            class="ui-range"
            @input="updateWeight"
          />
          <div class="flex justify-between text-[0.7rem] text-[color:var(--color-fg-subtle)] mt-1 tabular-nums">
            <span>80 lbs</span>
            <span>400 lbs</span>
          </div>
        </div>

        <div class="mb-4 text-sm">
          <span class="text-[color:var(--color-fg-muted)]">Daily Goal:</span>
          <span class="font-semibold text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)] ml-1 tabular-nums">
            {{ waterStore.data.settings.dailyGoal }} oz
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label class="ui-label">Start time</label>
            <input
              v-model="localStartTime"
              type="time"
              class="ui-input"
              @change="updateTimeSettings"
            />
          </div>
          <div>
            <label class="ui-label">End time</label>
            <input
              v-model="localEndTime"
              type="time"
              class="ui-input"
              @change="updateTimeSettings"
            />
          </div>
        </div>

        <div class="mb-4">
          <label class="ui-label">Reminder Interval: {{ localInterval }}h</label>
          <input
            v-model.number="localInterval"
            type="range"
            min="1"
            max="6"
            step="0.5"
            class="ui-range"
            @input="updateInterval"
          />
          <div class="flex justify-between text-[0.7rem] text-[color:var(--color-fg-subtle)] mt-1 tabular-nums">
            <span>1 h</span>
            <span>6 h</span>
          </div>
        </div>

        <UiButton variant="primary" block @click="showSettings = false">Done</UiButton>
      </div>
    </Transition>

    <div
      v-if="waterStore.error"
      class="mb-4 rounded-lg border border-[color:var(--color-danger-soft)] bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)] p-3 text-sm"
    >
      {{ waterStore.error }}
    </div>

    <!-- Progress -->
    <div class="mb-5">
      <div class="flex items-center justify-between text-xs text-[color:var(--color-fg-muted)] mb-1.5">
        <span>Daily progress</span>
        <span class="tabular-nums">
          {{ waterStore.todayCompletedOunces }} / {{ waterStore.data.settings.dailyGoal }} oz
        </span>
      </div>
      <div class="w-full bg-[color:var(--color-surface-2)] rounded-full h-2 overflow-hidden">
        <div
          class="h-full rounded-full bg-[color:var(--color-brand-600)] transition-all duration-500 ease-out"
          :style="{ width: `${waterStore.completionPercentage}%` }"
        ></div>
      </div>
      <div
        class="text-center mt-2 text-2xl font-bold text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)] tabular-nums"
      >
        {{ waterStore.completionPercentage }}%
      </div>
    </div>

    <!-- Next reminder -->
    <button
      v-if="waterStore.nextReminder"
      class="mb-3 w-full text-left rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] hover:bg-[color:var(--color-surface-3)] transition-colors p-3 flex items-center gap-3"
      @click="toggleReminder(waterStore.nextReminder)"
    >
      <div
        class="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-brand-100)] dark:bg-[color:var(--color-brand-900)]"
      >
        <Droplet
          class="h-5 w-5 text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-300)]"
          fill="currentColor"
        />
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-[color:var(--color-fg)]">Next reminder</div>
        <div class="text-xs text-[color:var(--color-fg-muted)] tabular-nums">
          {{ waterStore.nextReminder.time }} · {{ waterStore.nextReminder.amount }} oz
        </div>
      </div>
    </button>

    <!-- Overdue alert -->
    <div
      v-if="waterStore.overdueReminders.length > 0"
      class="mb-3 rounded-xl border border-[color:var(--color-warning-soft)] bg-[color:var(--color-warning-soft)] p-3 flex items-center gap-3"
    >
      <AlertCircle class="h-5 w-5 text-[color:var(--color-warning)] flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-[color:var(--color-fg)]">
          {{ waterStore.overdueReminders.length }} overdue reminder{{ waterStore.overdueReminders.length > 1 ? 's' : '' }}
        </div>
      </div>
      <UiButton
        v-if="waterStore.overdueReminders.length > 1"
        variant="primary"
        size="sm"
        @click="completeAllOverdueReminders"
      >
        Complete all
      </UiButton>
    </div>

    <!-- Reminders list -->
    <h3 class="text-[0.7rem] uppercase tracking-wider font-semibold text-[color:var(--color-fg-muted)] mb-2">
      Today's reminders
    </h3>

    <EmptyState
      v-if="waterStore.data.reminders.length === 0"
      :icon="Droplet"
      title="No reminders configured"
      description="Adjust your settings to start getting reminders."
    />

    <TransitionGroup v-else name="ui-list" tag="div" class="space-y-1.5">
      <div
        v-for="reminder in sortedReminders"
        :key="reminder.id"
        class="flex items-center gap-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2"
      >
        <button
          class="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          :class="
            reminder.completed
              ? 'bg-[color:var(--color-success)] text-white'
              : 'bg-[color:var(--color-brand-100)] dark:bg-[color:var(--color-brand-900)] text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-300)] hover:bg-[color:var(--color-brand-200)] dark:hover:bg-[color:var(--color-brand-800)]'
          "
          :aria-label="reminder.completed ? 'Mark incomplete' : 'Mark complete'"
          @click="toggleReminder(reminder)"
        >
          <Check v-if="reminder.completed" class="h-4 w-4" stroke-width="3" />
          <Droplet v-else class="h-4 w-4" fill="currentColor" />
        </button>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span
              class="text-sm font-medium tabular-nums"
              :class="
                reminder.completed
                  ? 'text-[color:var(--color-fg-subtle)] line-through'
                  : 'text-[color:var(--color-fg)]'
              "
            >
              {{ reminder.time }}
            </span>
            <UiPill variant="brand">{{ reminder.amount }} oz</UiPill>
          </div>
          <div
            v-if="reminder.completed && reminder.completedAt"
            class="text-[0.7rem] text-[color:var(--color-fg-subtle)]"
          >
            Done {{ formatTime(reminder.completedAt) }}
          </div>
        </div>

        <UiPill
          v-if="reminder.completed"
          variant="success"
        >
          Done
        </UiPill>
        <UiPill
          v-else-if="isOverdue(reminder.time)"
          variant="warning"
        >
          Overdue
        </UiPill>
      </div>
    </TransitionGroup>

    <div v-if="waterStore.data.reminders.length > 0" class="mt-5 pt-4 border-t border-[color:var(--color-border)]">
      <UiButton variant="ghost" size="sm" block @click="resetDailyProgress">
        Reset day
      </UiButton>
    </div>
  </WidgetCard>
</template>

<style scoped>
.ui-list-enter-active,
.ui-list-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}
.ui-list-enter-from,
.ui-list-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.ui-collapse-enter-active,
.ui-collapse-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}
.ui-collapse-enter-from,
.ui-collapse-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
