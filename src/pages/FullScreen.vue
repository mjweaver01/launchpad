<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { X, Layers } from 'lucide-vue-next';
import { useWidgetStore } from '../stores';
import DraggableWidget from '../components/widgets/DraggableWidget.vue';
import TimeWidget from '../components/widgets/TimeWidget.vue';
import WeatherWidget from '../components/widgets/WeatherWidget.vue';
import NewsWidget from '../components/widgets/NewsWidget.vue';
import TodoWidget from '../components/widgets/TodoWidget.vue';
import SearchWidget from '../components/widgets/SearchWidget.vue';
import CalendarWidget from '../components/widgets/CalendarWidget.vue';
import WaterReminderWidget from '../components/widgets/WaterReminderWidget.vue';
import EmptyState from '../components/ui/EmptyState.vue';
import UiButton from '../components/ui/UiButton.vue';

const widgetStore = useWidgetStore();
const router = useRouter();
const showExitButton = ref(false);
const mouseTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

const exitFullScreen = () => router.push('/');

const handleMouseMove = () => {
  showExitButton.value = true;
  if (mouseTimeout.value) clearTimeout(mouseTimeout.value);
  mouseTimeout.value = setTimeout(() => {
    showExitButton.value = false;
  }, 3000);
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') exitFullScreen();
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  showExitButton.value = true;
  setTimeout(() => (showExitButton.value = false), 3000);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  if (mouseTimeout.value) clearTimeout(mouseTimeout.value);
});
</script>

<template>
  <div
    class="fixed inset-0 bg-[color:var(--color-surface-2)] overflow-auto"
    @mousemove="handleMouseMove"
  >
    <Transition name="fade">
      <div v-show="showExitButton" class="fixed top-4 right-4 z-50">
        <button
          class="flex items-center gap-2 rounded-lg bg-black/40 dark:bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/60 dark:hover:bg-white/25"
          title="Exit full screen (ESC)"
          @click="exitFullScreen"
        >
          <X class="h-4 w-4" />
          Exit
        </button>
      </div>
    </Transition>

    <div class="min-h-screen w-full p-4">
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
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

      <div
        v-if="widgetStore.visibleWidgets.length === 0"
        class="flex items-center justify-center min-h-[60vh]"
      >
        <EmptyState
          :icon="Layers"
          title="No widgets visible"
          description="Go back to the main page to enable widgets."
        >
          <router-link to="/" custom v-slot="{ navigate }">
            <UiButton variant="primary" @click="navigate">Back to dashboard</UiButton>
          </router-link>
        </EmptyState>
      </div>
    </div>
  </div>
</template>

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
