<script setup lang="ts">
import { onMounted, computed } from 'vue';
import {
  Calendar,
  RefreshCw,
  LogOut,
  MapPin,
  ExternalLink,
  CalendarDays,
} from 'lucide-vue-next';
import { useCalendarStore } from '../../stores';
import type { CalendarEvent } from '../../stores/types';
import WidgetCard from './WidgetCard.vue';
import IconButton from '../ui/IconButton.vue';
import UiButton from '../ui/UiButton.vue';
import UiPill from '../ui/UiPill.vue';
import EmptyState from '../ui/EmptyState.vue';
import ErrorState from '../ui/ErrorState.vue';
import Spinner from '../ui/Spinner.vue';

const calendarStore = useCalendarStore();

const loadCalendar = async () => {
  if (calendarStore.isAuthenticated) {
    try {
      await calendarStore.loadCalendar();
    } catch (error) {
      console.error('Failed to load calendar:', error);
    }
  }
};

const signInWithGoogle = () => {
  try {
    calendarStore.signInWithGoogle();
  } catch (err) {
    console.error('Error during Google sign-in:', err);
  }
};

const refreshCalendar = () => calendarStore.refresh();
const retryLoadCalendar = () => loadCalendar();
const signOut = () => calendarStore.logout();

const formatEventTime = (event: CalendarEvent) => {
  if (event.start.date) return 'All day';
  if (!event.start.dateTime) return '';
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime || event.start.dateTime);
  const fmt = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${fmt(start)} – ${fmt(end)}`;
};

const formatEventDate = (event: CalendarEvent) => {
  const dateStr = event.start.date || event.start.dateTime;
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const getEventStatus = (event: CalendarEvent) => {
  if (event.start.date) return 'All Day';
  const now = new Date();
  const start = new Date(event.start.dateTime || '');
  const end = new Date(event.end.dateTime || event.start.dateTime || '');
  if (now < start) return 'Upcoming';
  if (now >= start && now <= end) return 'Now';
  return 'Past';
};

const getStatusVariant = (event: CalendarEvent) => {
  switch (getEventStatus(event)) {
    case 'Now':
      return 'success';
    case 'Upcoming':
      return 'brand';
    case 'All Day':
      return 'default';
    default:
      return 'default';
  }
};

const hasEvents = computed(
  () =>
    calendarStore.todaysEvents.length +
      calendarStore.tomorrowsEvents.length +
      calendarStore.upcomingEvents.length >
    0
);

onMounted(() => {
  calendarStore.initializeFromStorage();
  loadCalendar();
});
</script>

<template>
  <WidgetCard title="Calendar" :icon="Calendar" widgetName="calendar" displayName="Calendar">
    <template #actions>
      <template v-if="calendarStore.isAuthenticated">
        <IconButton
          :icon="RefreshCw"
          :spin="calendarStore.loading"
          :disabled="calendarStore.loading"
          label="Refresh calendar"
          @click="refreshCalendar"
        />
        <IconButton :icon="LogOut" label="Sign out" @click="signOut" />
      </template>
    </template>

    <!-- Sign-in -->
    <div v-if="!calendarStore.isAuthenticated" class="text-center py-6">
      <div
        class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-muted)]"
      >
        <Calendar class="h-6 w-6" />
      </div>
      <h3 class="text-sm font-semibold text-[color:var(--color-fg)] mb-1">
        Connect Google Calendar
      </h3>
      <p class="text-sm text-[color:var(--color-fg-muted)] max-w-sm mx-auto leading-relaxed mb-5">
        See today's, tomorrow's, and this week's events at a glance.
      </p>
      <UiButton
        variant="primary"
        :disabled="calendarStore.authLoading"
        @click="signInWithGoogle"
      >
        <Spinner v-if="calendarStore.authLoading" :size="14" />
        {{ calendarStore.authLoading ? 'Connecting…' : 'Sign in with Google' }}
      </UiButton>
    </div>

    <div v-else-if="calendarStore.loading && !hasEvents" class="text-center py-8">
      <Spinner :size="28" />
      <p class="text-sm text-[color:var(--color-fg-muted)] mt-3">Loading your events…</p>
    </div>

    <ErrorState
      v-else-if="calendarStore.error"
      :message="calendarStore.error"
      @retry="retryLoadCalendar"
    />

    <div v-else class="space-y-5">
      <div
        v-if="calendarStore.authState.userInfo"
        class="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3"
      >
        <img
          v-if="calendarStore.authState.userInfo.picture"
          :src="calendarStore.authState.userInfo.picture"
          :alt="calendarStore.authState.userInfo.name"
          class="w-8 h-8 rounded-full"
        />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-[color:var(--color-fg)] truncate">
            {{ calendarStore.authState.userInfo.name }}
          </p>
          <p class="text-xs text-[color:var(--color-fg-muted)] truncate">
            {{ calendarStore.authState.userInfo.email }}
          </p>
        </div>
      </div>

      <!-- Today's events -->
      <section v-if="calendarStore.todaysEvents.length > 0">
        <h3
          class="text-[0.7rem] uppercase tracking-wider font-semibold text-[color:var(--color-fg-muted)] mb-2"
        >
          Today
        </h3>
        <div class="space-y-2">
          <article
            v-for="event in calendarStore.todaysEvents"
            :key="event.id"
            class="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3"
          >
            <div class="flex items-start gap-2 justify-between">
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-[color:var(--color-fg)] truncate">
                  {{ event.summary }}
                </h4>
                <p class="text-xs text-[color:var(--color-fg-muted)] tabular-nums mt-0.5">
                  {{ formatEventTime(event) }}
                </p>
                <p
                  v-if="event.location"
                  class="text-xs text-[color:var(--color-fg-subtle)] mt-1 flex items-center gap-1 truncate"
                >
                  <MapPin class="h-3 w-3 flex-shrink-0" />
                  {{ event.location }}
                </p>
              </div>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <UiPill :variant="getStatusVariant(event)">{{ getEventStatus(event) }}</UiPill>
                <a
                  v-if="event.htmlLink"
                  :href="event.htmlLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ui-icon-btn"
                  title="Open in Google Calendar"
                  aria-label="Open in Google Calendar"
                >
                  <ExternalLink />
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section v-if="calendarStore.tomorrowsEvents.length > 0">
        <h3
          class="text-[0.7rem] uppercase tracking-wider font-semibold text-[color:var(--color-fg-muted)] mb-2"
        >
          Tomorrow
        </h3>
        <div class="space-y-2">
          <article
            v-for="event in calendarStore.tomorrowsEvents.slice(0, 3)"
            :key="event.id"
            class="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3"
          >
            <div class="flex items-start gap-2 justify-between">
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-[color:var(--color-fg)] truncate">
                  {{ event.summary }}
                </h4>
                <p class="text-xs text-[color:var(--color-fg-muted)] tabular-nums mt-0.5">
                  {{ formatEventTime(event) }}
                </p>
                <p
                  v-if="event.location"
                  class="text-xs text-[color:var(--color-fg-subtle)] mt-1 flex items-center gap-1 truncate"
                >
                  <MapPin class="h-3 w-3 flex-shrink-0" />
                  {{ event.location }}
                </p>
              </div>
              <a
                v-if="event.htmlLink"
                :href="event.htmlLink"
                target="_blank"
                rel="noopener noreferrer"
                class="ui-icon-btn flex-shrink-0"
                title="Open in Google Calendar"
                aria-label="Open in Google Calendar"
              >
                <ExternalLink />
              </a>
            </div>
          </article>
        </div>
      </section>

      <section v-if="calendarStore.upcomingEvents.length > 0">
        <h3
          class="text-[0.7rem] uppercase tracking-wider font-semibold text-[color:var(--color-fg-muted)] mb-2"
        >
          This week
        </h3>
        <div class="space-y-2">
          <article
            v-for="event in calendarStore.upcomingEvents.slice(0, 5)"
            :key="event.id"
            class="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3"
          >
            <h4 class="text-sm font-medium text-[color:var(--color-fg)] truncate">
              {{ event.summary }}
            </h4>
            <p class="text-xs text-[color:var(--color-fg-muted)] tabular-nums mt-0.5">
              {{ formatEventDate(event) }} · {{ formatEventTime(event) }}
            </p>
            <p
              v-if="event.location"
              class="text-xs text-[color:var(--color-fg-subtle)] mt-1 flex items-center gap-1 truncate"
            >
              <MapPin class="h-3 w-3 flex-shrink-0" />
              {{ event.location }}
            </p>
          </article>
        </div>
      </section>

      <EmptyState
        v-if="!hasEvents"
        :icon="CalendarDays"
        title="No upcoming events"
        description="Your calendar is clear for the next week."
      />
    </div>
  </WidgetCard>
</template>
