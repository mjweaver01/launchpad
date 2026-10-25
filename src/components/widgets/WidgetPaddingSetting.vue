<script setup lang="ts">
import { computed } from 'vue';
import { useWidgetStore, getWidgetPadding, WIDGET_PADDING } from '../../stores/widgets';

/** Padding slider for a widget instance, shown in widget settings popups. */
const props = defineProps<{ widgetId: string }>();

const widgetStore = useWidgetStore();
const inputId = computed(() => `widget-padding-${props.widgetId}`);
const padding = computed(() => {
  const widget = widgetStore.widgets.find(w => w.id === props.widgetId);
  return widget ? getWidgetPadding(widget) : WIDGET_PADDING.default;
});

const onInput = (event: Event) =>
  widgetStore.setWidgetPadding(props.widgetId, Number((event.target as HTMLInputElement).value));
</script>

<template>
  <div>
    <label class="ui-label flex justify-between" :for="inputId">
      <span>Padding</span>
      <span class="tabular-nums text-fg-muted">{{ padding }}px</span>
    </label>
    <input
      :id="inputId"
      type="range"
      class="ui-range"
      :min="WIDGET_PADDING.min"
      :max="WIDGET_PADDING.max"
      :step="WIDGET_PADDING.step"
      :value="padding"
      @input="onInput"
    />
  </div>
</template>
