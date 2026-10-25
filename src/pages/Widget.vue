<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { AlertTriangle } from 'lucide-vue-next';
import WeatherWidget from '../components/widgets/WeatherWidget.vue';
import CalendarWidget from '../components/widgets/CalendarWidget.vue';
import NewsWidget from '../components/widgets/NewsWidget.vue';
import TodoWidget from '../components/widgets/TodoWidget.vue';
import SearchWidget from '../components/widgets/SearchWidget.vue';
import TimeWidget from '../components/widgets/TimeWidget.vue';
import WaterReminderWidget from '../components/widgets/WaterReminderWidget.vue';
import EmptyState from '../components/ui/EmptyState.vue';

const route = useRoute();

const widgetMap = {
  weather: WeatherWidget,
  calendar: CalendarWidget,
  news: NewsWidget,
  todo: TodoWidget,
  search: SearchWidget,
  time: TimeWidget,
  water: WaterReminderWidget,
  'water-reminder': WaterReminderWidget,
};

const availableWidgets = Object.keys(widgetMap);

const currentWidget = computed(() => {
  const widgetName = (route.params.name as string)?.toLowerCase();
  return widgetMap[widgetName as keyof typeof widgetMap] || null;
});

const widgetInstanceId = computed(() => {
  const widgetName = (route.params.name as string)?.toLowerCase();
  if (widgetName === 'water') return 'water-reminder';
  return widgetName ?? 'time';
});

const widgetInstanceProps = computed(() => {
  const widgetName = (route.params.name as string)?.toLowerCase();
  if (
    widgetName === 'time' ||
    widgetName === 'weather' ||
    widgetName === 'water' ||
    widgetName === 'water-reminder'
  ) {
    return { widgetId: widgetInstanceId.value };
  }
  return {};
});
</script>

<template>
  <main class="mx-auto max-w-4xl px-4 sm:px-6 py-6">
    <component
      :is="currentWidget"
      v-if="currentWidget"
      v-bind="widgetInstanceProps"
      class="w-full"
    />
    <div v-else class="rounded-2xl border border-border bg-surface p-8">
      <EmptyState
        :icon="AlertTriangle"
        title="Widget not found"
        :description="`No widget named “${$route.params.name}”. Available: ${availableWidgets.join(', ')}.`"
      />
    </div>
  </main>
</template>
