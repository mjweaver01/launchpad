<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useWidgetStore } from '../../stores/widgets';
import { useGridResize } from '../../composables/useGridResize';

const props = defineProps<{
  widgetId: string;
  index: number;
  draggableActive?: boolean;
  /** Start drags only from the card header, so the widget's content stays usable. */
  dragByHeader?: boolean;
  /** Show a corner handle that resizes the widget in the dashboard grid (desktop). */
  resizable?: boolean;
}>();

const widgetElement = ref<HTMLElement>();
const widgetStore = useWidgetStore();
const resize = useGridResize(widgetElement, () => props.widgetId);

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
      dragHandle: props.dragByHeader
        ? (widgetElement.value.querySelector<HTMLElement>('.ui-card-header') ?? undefined)
        : undefined,
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
      'cursor-grab active:cursor-grabbing': draggableActive && !dragByHeader,
      'drag-by-header': draggableActive && dragByHeader,
      'is-resizing': resize.isResizing.value,
      'opacity-60 scale-[0.97] z-50 rotate-1 ring-2 ring-brand-500 ring-offset-2 ring-offset-surface-2':
        widgetStore.isDragging && widgetStore.draggedWidget === widgetId,
      'ring-2 ring-brand-400 ring-inset':
        widgetStore.dragOverIndex === index && widgetStore.draggedWidget !== widgetId,
      'hover:shadow-(--shadow-card-hover)':
        draggableActive && !dragByHeader && !widgetStore.isDragging,
    }"
    :data-widget-id="widgetId"
    :data-widget-index="index"
  >
    <div
      class="h-full"
      :class="{
        'pointer-events-none': widgetStore.isDragging && widgetStore.draggedWidget === widgetId,
      }"
    >
      <slot />
    </div>

    <div
      v-if="resizable"
      class="resize-handle"
      role="separator"
      tabindex="0"
      aria-label="Resize widget. Drag, or use arrow keys. Double-click to reset."
      title="Drag to resize"
      @pointerdown="resize.start"
      @pointermove="resize.move"
      @pointerup="resize.end"
      @pointercancel="resize.end"
      @lostpointercapture="resize.end"
      @dblclick="resize.reset"
      @keydown="resize.onKeydown"
    >
      <svg viewBox="0 0 10 10" aria-hidden="true">
        <path d="M9 3 3 9M9 6 6 9" />
      </svg>
    </div>

    <div
      v-if="
        widgetStore.dragOverIndex === index &&
        widgetStore.draggedWidget !== widgetId &&
        widgetStore.isDragging
      "
      class="absolute inset-0 rounded-card border-2 border-dashed border-brand-500 bg-brand-100/40 dark:bg-brand-900/30 backdrop-blur-sm pointer-events-none flex items-center justify-center z-40"
    >
      <span
        class="bg-brand-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-(--shadow-popover)"
      >
        Drop here
      </span>
    </div>
  </div>
</template>

<style scoped>
/* Drag from the header only; long-press on touch starts the drag, so suppress
   the long-press callout menu there. */
.drag-by-header :deep(.ui-card-header) {
  cursor: grab;
  -webkit-touch-callout: none;
}
.drag-by-header :deep(.ui-card-header):active {
  cursor: grabbing;
}

/* Corner resize handle: desktop grid only, shown on hover or keyboard focus. */
.resize-handle {
  position: absolute;
  right: 0.25rem;
  bottom: 0.25rem;
  z-index: 30;
  display: none;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0.2rem;
  border-radius: 0.375rem;
  color: var(--color-fg-muted);
  cursor: nwse-resize;
  touch-action: none;
  opacity: 0;
  transition: opacity 150ms ease;
  outline: none;
}
.resize-handle svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
}
@media (min-width: 768px) {
  .resize-handle {
    display: block;
  }
}
.relative:hover > .resize-handle,
.resize-handle:focus-visible,
.is-resizing > .resize-handle {
  opacity: 1;
}
.resize-handle:focus-visible {
  box-shadow: 0 0 0 2px var(--color-brand-500);
}

.cursor-grab
  :is(button, input, select, textarea, a, [role='button'], [tabindex]):not([tabindex='-1']) {
  cursor: pointer;
}
</style>
