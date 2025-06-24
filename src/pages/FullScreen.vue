<template>
  <div
    class="fixed inset-0 bg-gray-100 dark:bg-gray-900 overflow-auto"
    @mousemove="handleMouseMove"
  >
    <!-- Exit Full Screen Button - Shows on hover -->
    <Transition name="fade">
      <div v-show="showExitButton" class="fixed top-4 right-4 z-50">
        <button
          @click="exitFullScreen"
          class="group flex items-center gap-2 px-4 py-2 bg-black/20 dark:bg-white/20 text-white backdrop-blur-sm rounded-lg hover:bg-black/40 dark:hover:bg-white/40 transition-all duration-200 shadow-lg"
          title="Exit Full Screen (ESC)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span class="text-sm font-medium">Exit</span>
        </button>
      </div>
    </Transition>

    <!-- Widgets Grid - Full Screen View -->
    <div class="min-h-screen w-full p-4">
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        <DraggableWidget
          v-for="(widget, index) in widgetStore.visibleWidgets"
          :key="widget.id"
          :widget-id="widget.id"
          :index="index"
          :draggable-active="false"
        >
          <TimeWidget v-if="widget.component === 'TimeWidget'" />
          <WeatherWidget v-else-if="widget.component === 'WeatherWidget'" />
          <NewsWidget v-else-if="widget.component === 'NewsWidget'" />
          <CalendarWidget v-else-if="widget.component === 'CalendarWidget'" />
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
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWidgetStore } from '../stores/widgets';
import DraggableWidget from '../components/widgets/DraggableWidget.vue';
import TimeWidget from '../components/widgets/TimeWidget.vue';
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
    TimeWidget,
    WeatherWidget,
    NewsWidget,
    TodoWidget,
    SearchWidget,
    CalendarWidget,
    WaterReminderWidget,
  },
  setup() {
    const widgetStore = useWidgetStore();
    const router = useRouter();
    const showExitButton = ref(false);
    const mouseTimeout = ref<NodeJS.Timeout | null>(null);

    const exitFullScreen = () => {
      router.push('/');
    };

    const handleMouseMove = () => {
      showExitButton.value = true;

      // Clear existing timeout
      if (mouseTimeout.value) {
        clearTimeout(mouseTimeout.value);
      }

      // Hide button after 3 seconds of no mouse movement
      mouseTimeout.value = setTimeout(() => {
        showExitButton.value = false;
      }, 3000);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        exitFullScreen();
      }
    };

    onMounted(() => {
      // Add keyboard listener for ESC key
      document.addEventListener('keydown', handleKeydown);

      // Initially show the button briefly
      showExitButton.value = true;
      setTimeout(() => {
        showExitButton.value = false;
      }, 3000);
    });

    onUnmounted(() => {
      // Clean up event listeners and timeouts
      document.removeEventListener('keydown', handleKeydown);
      if (mouseTimeout.value) {
        clearTimeout(mouseTimeout.value);
      }
    });

    return {
      widgetStore,
      showExitButton,
      exitFullScreen,
      handleMouseMove,
    };
  },
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
