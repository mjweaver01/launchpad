<template>
  <div
    ref="widgetElement"
    class="max-h-[calc(50vh-6em)] overflow-hidden"
    :class="[
      'group relative transition-all duration-200 cursor-grab active:cursor-grabbing',
      {
        'opacity-60 scale-[0.95] shadow-2xl z-50 rotate-1 ring-4 ring-blue-500/30 ring-offset-2 ring-offset-white dark:ring-offset-gray-900':
          widgetStore.isDragging && widgetStore.draggedWidget === widgetId,
        'ring-2 ring-blue-400 dark:ring-blue-500 ring-inset bg-blue-50/30 dark:bg-blue-900/30 shadow-lg':
          widgetStore.dragOverIndex === index && widgetStore.draggedWidget !== widgetId,
        'hover:shadow-lg hover:scale-[1.02]': !widgetStore.isDragging,
        'mb-4': widgetStore.isDragging && widgetStore.draggedWidget === widgetId,
      },
    ]"
    :data-widget-id="widgetId"
    :data-widget-index="index"
    title="Drag to reorder"
    style="user-select: none; -webkit-user-select: none; -moz-user-select: none"
  >
    <!-- Widget Content -->
    <div
      class="h-full widget-content"
      :class="{
        'pointer-events-none': widgetStore.isDragging && widgetStore.draggedWidget === widgetId,
      }"
    >
      <slot />
    </div>

    <!-- Enhanced Drop Indicator -->
    <div
      v-if="
        widgetStore.dragOverIndex === index &&
        widgetStore.draggedWidget !== widgetId &&
        widgetStore.isDragging
      "
      class="absolute inset-0 border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-lg bg-blue-50/40 dark:bg-blue-900/40 backdrop-blur-sm pointer-events-none z-40 flex items-center justify-center"
    >
      <div
        class="bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg"
      >
        Drop here
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, nextTick } from 'vue';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useWidgetStore } from '../../stores/widgets';

export default defineComponent({
  name: 'DraggableWidget',
  props: {
    widgetId: {
      type: String,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const widgetElement = ref<HTMLElement>();
    const widgetStore = useWidgetStore();

    let dragCleanup: (() => void) | null = null;
    let dropCleanup: (() => void) | null = null;

    const setupDragAndDrop = async () => {
      await nextTick();

      if (!widgetElement.value) {
        console.warn('DraggableWidget: Element not ready, retrying...', props.widgetId);
        setTimeout(setupDragAndDrop, 100);
        return;
      }

      try {
        // Make the entire widget draggable
        dragCleanup = draggable({
          element: widgetElement.value,
          // No dragHandle - entire element is draggable
          getInitialData: () => ({
            type: 'widget',
            widgetId: props.widgetId,
            fromIndex: props.index,
          }),
          onDragStart: () => {
            widgetStore.setDraggedWidget(props.widgetId);
          },
          onDrop: () => {
            widgetStore.setDraggedWidget(null);
            widgetStore.setDragOverIndex(null);
          },
        });

        // Make the widget a drop target
        dropCleanup = dropTargetForElements({
          element: widgetElement.value,
          canDrop: ({ source }) => {
            return source.data.type === 'widget' && source.data.widgetId !== props.widgetId;
          },
          onDragEnter: () => {
            widgetStore.setDragOverIndex(props.index);
          },
          onDragLeave: () => {
            widgetStore.setDragOverIndex(null);
          },
          onDrop: ({ source }) => {
            const fromIndex = source.data.fromIndex as number;
            const toIndex = props.index;

            if (fromIndex !== toIndex) {
              widgetStore.reorderWidgets(fromIndex, toIndex);
            }

            widgetStore.setDragOverIndex(null);
          },
        });
      } catch (error) {
        console.error('Failed to setup drag and drop for widget:', props.widgetId, error);
      }
    };

    onMounted(() => {
      setupDragAndDrop();
    });

    onUnmounted(() => {
      dragCleanup?.();
      dropCleanup?.();
    });

    return {
      widgetElement,
      widgetStore,
    };
  },
});
</script>

<style>
/* Allow interactive elements within widgets to override drag cursor */
.cursor-grab
  :is(button, input, select, textarea, a, [role='button'], [tabindex]):not([tabindex='-1']) {
  cursor: pointer;
}

.cursor-grab
  :is(button, input, select, textarea, a, [role='button'], [tabindex]):not([tabindex='-1']):hover {
  cursor: pointer;
}

.widget-content > div {
  height: 100%;
}

/* Smooth transform origin for better drag animation */
.group {
  transform-origin: center;
}

/* Prevent content shift during drag operations */
.group.opacity-60 {
  will-change: transform, opacity;
}

/* Ensure drop zones have smooth transitions */
.ring-inset {
  transition: all 0.2s ease-in-out;
}

/* Better backdrop blur support fallback */
@supports not (backdrop-filter: blur(4px)) {
  .backdrop-blur-sm {
    background-color: rgba(59, 130, 246, 0.1);
  }
}

/* Improve drag handle visibility on mobile */
@media (hover: none) {
  .group .opacity-0 {
    opacity: 0.7;
  }
}
</style>
