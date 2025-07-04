<template>
  <div
    class="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full mx-auto transition-colors duration-200"
  >
    <div v-if="$route.name !== 'Full Screen'" class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200">Calendar</h2>
      <div class="flex items-center space-x-2">
        <button
          v-if="calendarStore.isAuthenticated"
          @click="refreshCalendar"
          :disabled="calendarStore.loading"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center"
          title="Refresh Calendar"
        >
          <svg
            class="w-4 h-4"
            :class="{ 'animate-spin': calendarStore.loading }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
        <button
          v-if="calendarStore.isAuthenticated"
          @click="signOut"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Sign Out"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
        <ExpandWidget widgetName="calendar" displayName="Calendar" />
      </div>
    </div>

    <div class="h-full overflow-y-auto">
      <!-- Authentication required -->
      <div v-if="!calendarStore.isAuthenticated" class="text-center">
        <div class="mb-4">
          <svg
            class="w-14 h-14 mx-auto text-gray-400 dark:text-gray-500 m-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2" />
            <line x1="16" y1="2" x2="16" y2="6" stroke-width="2" />
            <line x1="8" y1="2" x2="8" y2="6" stroke-width="2" />
            <line x1="3" y1="10" x2="21" y2="10" stroke-width="2" />
          </svg>
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Connect your Google Calendar to see your events
          </p>
        </div>

        <button
          @click="signInWithGoogle"
          :disabled="calendarStore.authLoading"
          class="flex items-center justify-center w-full px-4 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            v-if="calendarStore.authLoading"
            class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <svg v-else class="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {{ calendarStore.authLoading ? 'Connecting...' : 'Connect Google Calendar' }}
        </button>
      </div>

      <!-- Loading state -->
      <div v-else-if="calendarStore.loading" class="text-center">
        <LoadingSpinner />
        <p class="text-gray-600 dark:text-gray-400 mt-2">Loading your events...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="calendarStore.error" class="text-center">
        <div class="text-red-500 dark:text-red-400 mb-2">
          <svg class="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <p class="text-red-600 dark:text-red-400 text-sm mb-3">{{ calendarStore.error }}</p>
        <button
          @click="retryLoadCalendar"
          class="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
        >
          Try Again
        </button>
      </div>

      <!-- Calendar data -->
      <div v-else class="space-y-4">
        <!-- User info -->
        <div
          v-if="calendarStore.authState.userInfo"
          class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <img
            v-if="calendarStore.authState.userInfo.picture"
            :src="calendarStore.authState.userInfo.picture"
            :alt="calendarStore.authState.userInfo.name"
            class="w-8 h-8 rounded-full mr-3"
          />
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
              {{ calendarStore.authState.userInfo.name }}
            </p>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              {{ calendarStore.authState.userInfo.email }}
            </p>
          </div>
        </div>

        <!-- Today's events -->
        <div v-if="calendarStore.todaysEvents.length > 0">
          <h3 class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
            <svg
              class="w-4 h-4 mr-1 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Today
          </h3>
          <div class="space-y-2">
            <div
              v-for="event in calendarStore.todaysEvents"
              :key="event.id"
              class="p-3 bg-green-50 dark:bg-green-900 border-l-4 border-green-400 dark:border-green-500 rounded-r-lg"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                    {{ event.summary }}
                  </h4>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    {{ formatEventTime(event) }}
                  </p>
                  <p
                    v-if="event.location"
                    class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center"
                  >
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {{ event.location }}
                  </p>
                </div>
                <a
                  :href="event.htmlLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-green-600 hover:text-green-800 transition-colors"
                  title="Open in Google Calendar"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
                <div class="ml-2">
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    :class="getEventStatusColor(event)"
                  >
                    {{ getEventStatus(event) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tomorrow's events -->
        <div v-if="calendarStore.tomorrowsEvents.length > 0">
          <h3 class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
            <svg
              class="w-4 h-4 mr-1 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Tomorrow
          </h3>
          <div class="space-y-2">
            <div
              v-for="event in calendarStore.tomorrowsEvents.slice(0, 3)"
              :key="event.id"
              class="p-3 bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-400 dark:border-blue-500 rounded-r-lg"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                    {{ event.summary }}
                  </h4>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    {{ formatEventTime(event) }}
                  </p>
                  <p
                    v-if="event.location"
                    class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center"
                  >
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {{ event.location }}
                  </p>
                </div>
                <a
                  :href="event.htmlLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Open in Google Calendar"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming events -->
        <div v-if="calendarStore.upcomingEvents.length > 0">
          <h3 class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
            <svg
              class="w-4 h-4 mr-1 text-purple-600 dark:text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            This Week
          </h3>
          <div class="space-y-2">
            <div
              v-for="event in calendarStore.upcomingEvents.slice(0, 5)"
              :key="event.id"
              class="p-3 bg-purple-50 dark:bg-purple-900 border-l-4 border-purple-400 dark:border-purple-500 rounded-r-lg"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                    {{ event.summary }}
                  </h4>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    {{ formatEventDate(event) }} at {{ formatEventTime(event) }}
                  </p>
                  <p
                    v-if="event.location"
                    class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center"
                  >
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {{ event.location }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No events message -->
        <div
          v-if="
            calendarStore.todaysEvents.length === 0 &&
            calendarStore.tomorrowsEvents.length === 0 &&
            calendarStore.upcomingEvents.length === 0
          "
          class="text-center py-12"
        >
          <div class="text-gray-400 dark:text-gray-500 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
            No upcoming events
          </h3>
          <p class="text-gray-500 dark:text-gray-500">
            Your calendar looks clear for the next week.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import LoadingSpinner from '../LoadingSpinner.vue';
import ExpandWidget from './ExpandWidget.vue';
import { useCalendarStore } from '../../stores';
import type { CalendarEvent } from '../../stores/types';

export default defineComponent({
  name: 'CalendarWidget',
  components: {
    LoadingSpinner,
    ExpandWidget,
  },
  setup() {
    const calendarStore = useCalendarStore();
    const route = useRoute();

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
      console.log('CalendarWidget: signInWithGoogle button clicked!');
      try {
        console.log('Attempting to sign in with Google...');
        console.log('Calendar store:', calendarStore);
        console.log('Calendar store signInWithGoogle method:', calendarStore.signInWithGoogle);
        calendarStore.signInWithGoogle();
      } catch (err) {
        console.error('Error during Google sign-in:', err);
      }
    };

    const refreshCalendar = () => {
      calendarStore.refresh();
    };

    const retryLoadCalendar = () => {
      loadCalendar();
    };

    const signOut = () => {
      calendarStore.logout();
    };

    const formatEventTime = (event: CalendarEvent): string => {
      if (event.start.date) {
        // All-day event
        return 'All day';
      }

      if (event.start.dateTime) {
        const startTime = new Date(event.start.dateTime);
        const endTime = new Date(event.end.dateTime || event.start.dateTime);

        const startTimeStr = startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        const endTimeStr = endTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        return `${startTimeStr} - ${endTimeStr}`;
      }

      return '';
    };

    const formatEventDate = (event: CalendarEvent): string => {
      if (event.start.date) {
        const eventDate = new Date(event.start.date);
        return eventDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
      }

      if (event.start.dateTime) {
        const eventDate = new Date(event.start.dateTime);
        return eventDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
      }

      return '';
    };

    const getEventStatus = (event: CalendarEvent): string => {
      if (event.start.date) {
        return 'All Day';
      }

      const now = new Date();
      const startTime = new Date(event.start.dateTime || '');
      const endTime = new Date(event.end.dateTime || event.start.dateTime || '');

      if (now < startTime) {
        return 'Upcoming';
      } else if (now >= startTime && now <= endTime) {
        return 'In Progress';
      } else {
        return 'Completed';
      }
    };

    const getEventStatusColor = (event: CalendarEvent): string => {
      const status = getEventStatus(event);

      switch (status) {
        case 'In Progress':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'Upcoming':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'All Day':
          return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        case 'Completed':
          return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      }
    };

    onMounted(() => {
      calendarStore.initializeFromStorage();
      loadCalendar();
    });

    return {
      route,
      calendarStore,
      signInWithGoogle,
      refreshCalendar,
      retryLoadCalendar,
      signOut,
      formatEventTime,
      formatEventDate,
      getEventStatus,
      getEventStatusColor,
    };
  },
});
</script>
