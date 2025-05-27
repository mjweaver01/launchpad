<template>
  <div
    ref="widgetElement"
    :class="[
      'relative transition-all duration-200 cursor-grab active:cursor-grabbing',
      {
        'opacity-75 scale-[0.98]': widgetStore.isDragging && widgetStore.draggedWidget === widgetId,
        'ring-2 ring-blue-400 ring-opacity-50':
          widgetStore.dragOverIndex === index && widgetStore.draggedWidget !== widgetId,
        'hover:shadow-lg': !widgetStore.isDragging,
      },
    ]"
    :data-widget-id="widgetId"
    :data-widget-index="index"
    title="Drag to reorder"
    style="user-select: none; -webkit-user-select: none; -moz-user-select: none"
  >
    <!-- Widget Content -->
    <div class="h-full widget-content">
      <slot />
    </div>

    <!-- Drop Indicator -->
    <div
      v-if="
        widgetStore.dragOverIndex === index &&
        widgetStore.draggedWidget !== widgetId &&
        widgetStore.isDragging
      "
      class="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50/20 pointer-events-none z-40"
    />
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
</style>
