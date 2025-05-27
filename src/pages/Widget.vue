<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Header with back button -->
      <!-- <div class="mb-6 flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white capitalize">
          {{ widgetDisplayName }}
        </h1>
        <button
          @click="goHome"
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </button>
      </div> -->

      <!-- Widget Container -->
      <div class="widget-container">
        <component :is="currentWidget" v-if="currentWidget" class="w-full" />
        <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div class="text-gray-500 dark:text-gray-400">
            <svg
              class="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h2 class="text-xl font-semibold mb-2">Widget Not Found</h2>
            <p class="text-sm">The widget "{{ $route.params.name }}" doesn't exist.</p>
            <p class="text-sm mt-2">Available widgets: {{ availableWidgets.join(', ') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

// Import all widget components
import WeatherWidget from '../components/WeatherWidget.vue';
import CalendarWidget from '../components/CalendarWidget.vue';
import NewsWidget from '../components/NewsWidget.vue';
import TodoWidget from '../components/TodoWidget.vue';
import SearchWidget from '../components/SearchWidget.vue';
import WaterReminderWidget from '../components/WaterReminderWidget.vue';

export default defineComponent({
  name: 'Widget',
  components: {
    WeatherWidget,
    CalendarWidget,
    NewsWidget,
    TodoWidget,
    SearchWidget,
    WaterReminderWidget,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();

    // Map of widget names to components
    const widgetMap = {
      weather: WeatherWidget,
      calendar: CalendarWidget,
      news: NewsWidget,
      todo: TodoWidget,
      search: SearchWidget,
      water: WaterReminderWidget,
      'water-reminder': WaterReminderWidget, // Alternative name
    };

    // Get available widget names
    const availableWidgets = Object.keys(widgetMap);

    // Get the current widget based on route parameter
    const currentWidget = computed(() => {
      const widgetName = (route.params.name as string)?.toLowerCase();
      return widgetMap[widgetName as keyof typeof widgetMap] || null;
    });

    // Get display name for the widget
    const widgetDisplayName = computed(() => {
      const widgetName = route.params.name as string;
      if (!widgetName) return 'Widget';

      // Convert kebab-case or snake_case to title case
      return widgetName
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    });

    // Navigation function
    const goHome = () => {
      router.push('/');
    };

    return {
      currentWidget,
      widgetDisplayName,
      availableWidgets,
      goHome,
    };
  },
});
</script>
