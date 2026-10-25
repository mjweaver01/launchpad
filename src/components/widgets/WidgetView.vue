<script setup lang="ts">
import { computed, type Component } from 'vue';
import type { Widget } from '../../stores/widgets';
import TimeWidget from './TimeWidget.vue';
import WeatherWidget from './WeatherWidget.vue';
import NewsWidget from './NewsWidget.vue';
import TodoWidget from './TodoWidget.vue';
import SearchWidget from './SearchWidget.vue';
import CalendarWidget from './CalendarWidget.vue';
import WaterReminderWidget from './WaterReminderWidget.vue';

/** Renders the component for a widget instance (dashboard and full screen). */
const props = defineProps<{ widget: Widget }>();

const COMPONENTS: Record<string, Component> = {
  TimeWidget,
  WeatherWidget,
  NewsWidget,
  TodoWidget,
  SearchWidget,
  CalendarWidget,
  WaterReminderWidget,
};

// Widgets with per-instance settings need their instance id.
const TAKES_WIDGET_ID = new Set(['TimeWidget', 'WeatherWidget', 'WaterReminderWidget']);

const component = computed(() => COMPONENTS[props.widget.component]);
const instanceProps = computed(() =>
  TAKES_WIDGET_ID.has(props.widget.component) ? { widgetId: props.widget.id } : {}
);
</script>

<template>
  <component :is="component" v-if="component" v-bind="instanceProps" />
</template>
