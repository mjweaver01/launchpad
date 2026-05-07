<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useWidgetStore } from '../../stores/widgets';

const props = defineProps<{
  widgetId: string;
  index: number;
  draggableActive?: boolean;
}>();

const widgetElement = ref<HTMLElement>();
const widgetStore = useWidgetStore();

let dragCleanup: (() => void) | null = null;
let dropCleanup: (() => void) | null = null;

const cleanupDragAndDrop = () => {
  dragCleanup?.();
  dropCleanup?.();
  dragCleanup = null;
  dropCleanup = null;
};

const setupDragAndDrop = async () => {
  await nextTick();
  if (!widgetElement.value || !props.draggableActive) return;

  try {
    dragCleanup = draggable({
      element: widgetElement.value,
      getInitialData: () => ({
        type: 'widget',
        widgetId: props.widgetId,
        fromIndex: props.index,
      }),
      onDragStart: () => widgetStore.setDraggedWidget(props.widgetId),
      onDrop: () => {
        widgetStore.setDraggedWidget(null);
        widgetStore.setDragOverIndex(null);
      },
    });

    dropCleanup = dropTargetForElements({
      element: widgetElement.value,
      canDrop: ({ source }) =>
        source.data.type === 'widget' && source.data.widgetId !== props.widgetId,
      onDragEnter: () => widgetStore.setDragOverIndex(props.index),
      onDragLeave: () => widgetStore.setDragOverIndex(null),
      onDrop: ({ source }) => {
        const fromIndex = source.data.fromIndex as number;
        const toIndex = props.index;
        if (fromIndex !== toIndex) widgetStore.reorderWidgets(fromIndex, toIndex);
        widgetStore.setDragOverIndex(null);
      },
    });
  } catch (error) {
    console.error('Failed to setup drag and drop for widget:', props.widgetId, error);
  }
};

watch(
  () => props.draggableActive,
  active => {
    if (active) setupDragAndDrop();
    else cleanupDragAndDrop();
  }
);

onMounted(setupDragAndDrop);
onUnmounted(cleanupDragAndDrop);
</script>

<template>
  <div
    ref="widgetElement"
    class="relative overflow-hidden transition-all duration-200 select-none"
    :class="{
      'cursor-grab active:cursor-grabbing': draggableActive,
      'opacity-60 scale-[0.97] z-50 rotate-1 ring-2 ring-[color:var(--color-brand-500)] ring-offset-2 ring-offset-[color:var(--color-surface-2)]':
        widgetStore.isDragging && widgetStore.draggedWidget === widgetId,
      'ring-2 ring-[color:var(--color-brand-400)] ring-inset':
        widgetStore.dragOverIndex === index && widgetStore.draggedWidget !== widgetId,
      'hover:shadow-[var(--shadow-card-hover)]': draggableActive && !widgetStore.isDragging,
    }"
    :data-widget-id="widgetId"
    :data-widget-index="index"
  >
    <div
      class="h-full"
      :class="{
        'pointer-events-none':
          widgetStore.isDragging && widgetStore.draggedWidget === widgetId,
      }"
    >
      <slot />
    </div>

    <div
      v-if="
        widgetStore.dragOverIndex === index &&
        widgetStore.draggedWidget !== widgetId &&
        widgetStore.isDragging
      "
      class="absolute inset-0 rounded-[var(--radius-card)] border-2 border-dashed border-[color:var(--color-brand-500)] bg-[color:var(--color-brand-100)]/40 dark:bg-[color:var(--color-brand-900)]/30 backdrop-blur-sm pointer-events-none flex items-center justify-center z-40"
    >
      <span
        class="bg-[color:var(--color-brand-600)] text-white px-3 py-1 rounded-full text-xs font-medium shadow-[var(--shadow-popover)]"
      >
        Drop here
      </span>
    </div>
  </div>
</template>

<style scoped>
.cursor-grab :is(button, input, select, textarea, a, [role='button'], [tabindex]):not(
    [tabindex='-1']
  ) {
  cursor: pointer;
}
</style>
