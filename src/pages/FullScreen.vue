<template>
  <div class="min-h-screen w-full p-4">
    <!-- Widgets Grid - Full Screen View -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
      <DraggableWidget
        v-for="(widget, index) in widgetStore.visibleWidgets"
        :key="widget.id"
        :widget-id="widget.id"
        :index="index"
        :draggable-active="false"
      >
        <WeatherWidget v-if="widget.component === 'WeatherWidget'" />
        <CalendarWidget v-else-if="widget.component === 'CalendarWidget'" />
        <NewsWidget v-else-if="widget.component === 'NewsWidget'" />
        <TodoWidget v-else-if="widget.component === 'TodoWidget'" />
        <SearchWidget v-else-if="widget.component === 'SearchWidget'" />
        <WaterReminderWidget v-else-if="widget.component === 'WaterReminderWidget'" />
      </DraggableWidget>
    </div>

    <!-- Empty State for Full Screen -->
    <div
      v-if="widgetStore.visibleWidgets.length === 0"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="text-center">
        <div class="text-gray-400 dark:text-gray-500 mb-4">
          <svg class="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h3 class="text-2xl font-medium text-gray-600 dark:text-gray-400 mb-2">
          No widgets visible
        </h3>
        <p class="text-gray-500 dark:text-gray-500 mb-4">
          Go back to the main page to enable widgets
        </p>
        <router-link
          to="/"
          class="inline-block px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          Back to Dashboard
        </router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useWidgetStore } from '../stores/widgets';
import DraggableWidget from '../components/widgets/DraggableWidget.vue';
import WeatherWidget from '../components/widgets/WeatherWidget.vue';
import NewsWidget from '../components/widgets/NewsWidget.vue';
import TodoWidget from '../components/widgets/TodoWidget.vue';
import SearchWidget from '../components/widgets/SearchWidget.vue';
import CalendarWidget from '../components/widgets/CalendarWidget.vue';
import WaterReminderWidget from '../components/widgets/WaterReminderWidget.vue';

export default defineComponent({
  name: 'FullScreen',
  components: {
    DraggableWidget,
    WeatherWidget,
    NewsWidget,
    TodoWidget,
    SearchWidget,
    CalendarWidget,
    WaterReminderWidget,
  },
  setup() {
    const widgetStore = useWidgetStore();

    return {
      widgetStore,
    };
  },
});
</script>
