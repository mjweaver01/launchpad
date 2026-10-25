<script setup lang="ts">
import { ref, computed } from 'vue';
import { LayoutGrid, Eye, EyeOff, GripVertical, RotateCcw, Layers } from 'lucide-vue-next';
import { useWidgetStore, getWidgetSize } from '../stores/widgets';
import DraggableWidget from '../components/widgets/DraggableWidget.vue';
import WidgetView from '../components/widgets/WidgetView.vue';
import UiButton from '../components/ui/UiButton.vue';
import EmptyState from '../components/ui/EmptyState.vue';

const widgetStore = useWidgetStore();
const showWidgetManager = ref(false);

// Visible first, then hidden: the same order (and indexes) the store reorders by.
const managedWidgets = computed(() => [
  ...widgetStore.visibleWidgets,
  ...widgetStore.hiddenWidgets,
]);

const sizeStyle = (widget: (typeof widgetStore.widgets)[number]) => {
  const { colSpan, rowSpan } = getWidgetSize(widget);
  return { '--col-span': colSpan, '--row-span': rowSpan };
};
</script>

<template>
  <main class="mx-auto max-w-7xl px-4 sm:px-6 py-6">
    <!-- Top bar -->
    <div class="flex items-center justify-between mb-5">
      <div class="text-sm text-fg-muted tabular-nums">
        {{ widgetStore.visibleWidgets.length }} of {{ widgetStore.widgets.length }} widgets
      </div>
      <UiButton
        :leading-icon="LayoutGrid"
        :variant="showWidgetManager ? 'primary' : 'secondary'"
        size="sm"
        @click="showWidgetManager = !showWidgetManager"
      >
        Manage widgets
      </UiButton>
    </div>

    <!-- Widget manager: order and visibility -->
    <Transition name="ui-collapse">
      <section
        v-if="showWidgetManager"
        class="mb-6 rounded-2xl border border-border bg-surface p-5"
      >
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-fg">Widgets</h3>
            <p class="text-xs text-fg-muted mt-0.5">Drag to reorder, and show or hide widgets.</p>
          </div>
          <UiButton
            variant="danger"
            size="sm"
            :leading-icon="RotateCcw"
            @click="widgetStore.resetToDefault()"
          >
            Reset
          </UiButton>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <DraggableWidget
            v-for="(widget, index) in managedWidgets"
            :key="widget.id"
            :widget-id="widget.id"
            :index="index"
            draggable-active
          >
            <div
              class="flex items-center justify-between rounded-lg border px-3 py-2"
              :class="
                widget.visible
                  ? 'border-border bg-surface'
                  : 'border-dashed border-border bg-surface-2 opacity-70'
              "
            >
              <div class="flex items-center gap-2 min-w-0">
                <GripVertical class="h-4 w-4 text-fg-subtle shrink-0" />
                <span
                  class="text-sm font-medium truncate"
                  :class="widget.visible ? 'text-fg' : 'text-fg-muted'"
                >
                  {{ widget.name }}
                </span>
              </div>
              <button
                class="ui-icon-btn shrink-0"
                :aria-label="`${widget.visible ? 'Hide' : 'Show'} ${widget.name}`"
                :data-tooltip="widget.visible ? 'Hide' : 'Show'"
                @click="widgetStore.toggleWidgetVisibility(widget.id)"
              >
                <component :is="widget.visible ? Eye : EyeOff" />
              </button>
            </div>
          </DraggableWidget>
        </div>
      </section>
    </Transition>

    <!-- Widgets: drag a header to move; on desktop, drag the corner to resize -->
    <div class="dashboard-grid">
      <DraggableWidget
        v-for="(widget, index) in widgetStore.visibleWidgets"
        :key="widget.id"
        :widget-id="widget.id"
        :index="index"
        :style="sizeStyle(widget)"
        draggable-active
        drag-by-header
        resizable
      >
        <WidgetView :widget="widget" />
      </DraggableWidget>
    </div>

    <EmptyState
      v-if="widgetStore.visibleWidgets.length === 0"
      :icon="Layers"
      title="No widgets visible"
      description="Enable widgets to populate your dashboard."
    >
      <UiButton variant="primary" :leading-icon="LayoutGrid" @click="showWidgetManager = true">
        Manage widgets
      </UiButton>
    </EmptyState>
  </main>
</template>

<style scoped>
/* Phones: one column, natural heights. Desktop: a six-column grid with fixed
   row steps; each widget spans its saved size (see the widget store). */
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}
@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    grid-auto-rows: 3.5rem;
    gap: 1.25rem;
  }
  .dashboard-grid > * {
    grid-column: span var(--col-span) / span var(--col-span);
    grid-row: span var(--row-span) / span var(--row-span);
  }
}

.ui-collapse-enter-active,
.ui-collapse-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}
.ui-collapse-enter-from,
.ui-collapse-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
