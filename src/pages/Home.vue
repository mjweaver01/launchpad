<template>
  <div class="p-4 sm:p-6 w-full">
    <!-- Widget Management Header -->
    <div class="flex items-center justify-between mb-4 sm:mb-6">
      <span></span>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ widgetStore.visibleWidgets.length }} of {{ widgetStore.widgets.length }} widgets
          visible
        </span>
        <button
          @click="showWidgetManager = !showWidgetManager"
          class="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm text-gray-900 dark:text-gray-100"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          Manage Widgets
        </button>
      </div>
    </div>

    <!-- Widget Manager Panel -->
    <div
      v-if="showWidgetManager"
      class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-semibold text-gray-800 dark:text-gray-200">Widget Settings</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Drag tiles below, or the widgets themselves, to reorder
          </p>
        </div>
        <button
          @click="widgetStore.resetToDefault()"
          class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
        >
          Reset to Default
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <!-- Visible Widgets (in display order) -->
        <DraggableWidget
          v-for="(widget, index) in widgetStore.visibleWidgets"
          :key="widget.id"
          :widget-id="widget.id"
          :index="index"
          :draggable-active="showWidgetManager"
        >
          <div
            class="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
          >
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 9h8M8 15h8"
                  />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{
                widget.name
              }}</span>
            </div>
            <button
              @click="widgetStore.toggleWidgetVisibility(widget.id)"
              class="px-3 py-1 rounded text-xs font-medium transition-colors bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
            >
              Hide
            </button>
          </div>
        </DraggableWidget>

        <!-- Hidden Widgets -->
        <DraggableWidget
          v-for="(widget, index) in widgetStore.hiddenWidgets"
          :key="widget.id"
          :widget-id="widget.id"
          :index="widgetStore.visibleWidgets.length + index"
          :draggable-active="showWidgetManager"
        >
          <div
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded border border-dashed border-gray-300 dark:border-gray-600 opacity-75"
          >
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 9h8M8 15h8"
                  />
                </svg>
                <span class="text-sm font-medium">—</span>
              </div>
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400">{{
                widget.name
              }}</span>
            </div>
            <button
              @click="widgetStore.toggleWidgetVisibility(widget.id)"
              class="px-3 py-1 rounded text-xs font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Show
            </button>
          </div>
        </DraggableWidget>
      </div>
    </div>

    <!-- Drag and Drop Instructions -->
    <!-- <div
      v-if="!widgetStore.isDragging && widgetStore.visibleWidgets.length > 1"
      class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
    >
      <div class="flex items-center gap-2 text-blue-800 text-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Click and drag any widget to reorder your dashboard</span>
      </div>
    </div> -->

    <!-- Dragging Instructions -->
    <!-- <div
      v-if="widgetStore.isDragging"
      class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
    >
      <div class="flex items-center gap-2 text-yellow-800 text-sm">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
            clip-rule="evenodd"
          />
        </svg>
        <span>Drop to reorder</span>
      </div>
    </div> -->

    <!-- Widgets Grid -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
      <DraggableWidget
        v-for="(widget, index) in widgetStore.visibleWidgets"
        :key="widget.id"
        :widget-id="widget.id"
        :index="index"
        :draggable-active="showWidgetManager"
      >
        <TimeWidget v-if="widget.component === 'TimeWidget'" />
        <WeatherWidget v-else-if="widget.component === 'WeatherWidget'" />
        <CalendarWidget v-else-if="widget.component === 'CalendarWidget'" />
        <NewsWidget v-else-if="widget.component === 'NewsWidget'" />
        <TodoWidget v-else-if="widget.component === 'TodoWidget'" />
        <SearchWidget v-else-if="widget.component === 'SearchWidget'" />
        <WaterReminderWidget v-else-if="widget.component === 'WaterReminderWidget'" />
      </DraggableWidget>
    </div>

    <!-- Empty State -->
    <div v-if="widgetStore.visibleWidgets.length === 0" class="text-center py-12">
      <div class="text-gray-400 dark:text-gray-500 mb-4">
        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No widgets visible</h3>
      <p class="text-gray-500 dark:text-gray-500 mb-4">Enable some widgets to get started</p>
      <button
        @click="showWidgetManager = true"
        class="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
      >
        Manage Widgets
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useWidgetStore } from '../stores/widgets';
import DraggableWidget from '../components/widgets/DraggableWidget.vue';
import WeatherWidget from '../components/widgets/WeatherWidget.vue';
import NewsWidget from '../components/widgets/NewsWidget.vue';
import TodoWidget from '../components/widgets/TodoWidget.vue';
import SearchWidget from '../components/widgets/SearchWidget.vue';
import CalendarWidget from '../components/widgets/CalendarWidget.vue';
import WaterReminderWidget from '../components/widgets/WaterReminderWidget.vue';
import TimeWidget from '../components/widgets/TimeWidget.vue';

export default defineComponent({
  name: 'Home',
  components: {
    DraggableWidget,
    WeatherWidget,
    NewsWidget,
    TodoWidget,
    SearchWidget,
    CalendarWidget,
    WaterReminderWidget,
    TimeWidget,
  },
  setup() {
    const widgetStore = useWidgetStore();
    const showWidgetManager = ref(false);

    return {
      widgetStore,
      showWidgetManager,
    };
  },
});
</script>
