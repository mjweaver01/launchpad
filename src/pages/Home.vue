<script setup lang="ts">
import { ref } from 'vue';
import { LayoutGrid, Eye, EyeOff, GripVertical, RotateCcw, Layers } from 'lucide-vue-next';
import { useWidgetStore } from '../stores/widgets';
import DraggableWidget from '../components/widgets/DraggableWidget.vue';
import TimeWidget from '../components/widgets/TimeWidget.vue';
import WeatherWidget from '../components/widgets/WeatherWidget.vue';
import NewsWidget from '../components/widgets/NewsWidget.vue';
import TodoWidget from '../components/widgets/TodoWidget.vue';
import SearchWidget from '../components/widgets/SearchWidget.vue';
import CalendarWidget from '../components/widgets/CalendarWidget.vue';
import WaterReminderWidget from '../components/widgets/WaterReminderWidget.vue';
import UiButton from '../components/ui/UiButton.vue';
import EmptyState from '../components/ui/EmptyState.vue';

const widgetStore = useWidgetStore();
const showWidgetManager = ref(false);
</script>

<template>
  <main class="mx-auto max-w-7xl px-4 sm:px-6 py-6">
    <!-- Top bar -->
    <div class="flex items-center justify-between mb-5">
      <div class="text-sm text-[color:var(--color-fg-muted)] tabular-nums">
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

    <!-- Widget Manager -->
    <Transition name="ui-collapse">
      <section
        v-if="showWidgetManager"
        class="mb-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
      >
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-[color:var(--color-fg)]">Widget Settings</h3>
            <p class="text-xs text-[color:var(--color-fg-muted)] mt-0.5">
              Drag tiles below — or the widgets themselves — to reorder.
            </p>
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
            v-for="(widget, index) in widgetStore.visibleWidgets"
            :key="widget.id"
            :widget-id="widget.id"
            :index="index"
            :draggable-active="showWidgetManager"
          >
            <div
              class="flex items-center justify-between rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2"
            >
              <div class="flex items-center gap-2 min-w-0">
                <GripVertical class="h-4 w-4 text-[color:var(--color-fg-subtle)] flex-shrink-0" />
                <span class="text-sm font-medium text-[color:var(--color-fg)] truncate">
                  {{ widget.name }}
                </span>
              </div>
              <button
                class="ui-icon-btn"
                :aria-label="`Hide ${widget.name}`"
                title="Hide"
                @click="widgetStore.toggleWidgetVisibility(widget.id)"
              >
                <Eye />
              </button>
            </div>
          </DraggableWidget>
          <DraggableWidget
            v-for="(widget, index) in widgetStore.hiddenWidgets"
            :key="widget.id"
            :widget-id="widget.id"
            :index="widgetStore.visibleWidgets.length + index"
            :draggable-active="showWidgetManager"
          >
            <div
              class="flex items-center justify-between rounded-lg border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 opacity-70"
            >
              <div class="flex items-center gap-2 min-w-0">
                <GripVertical class="h-4 w-4 text-[color:var(--color-fg-subtle)] flex-shrink-0" />
                <span class="text-sm font-medium text-[color:var(--color-fg-muted)] truncate">
                  {{ widget.name }}
                </span>
              </div>
              <button
                class="ui-icon-btn"
                :aria-label="`Show ${widget.name}`"
                title="Show"
                @click="widgetStore.toggleWidgetVisibility(widget.id)"
              >
                <EyeOff />
              </button>
            </div>
          </DraggableWidget>
        </div>
      </section>
    </Transition>

    <!-- Widgets grid -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      <DraggableWidget
        v-for="(widget, index) in widgetStore.visibleWidgets"
        :key="widget.id"
        :widget-id="widget.id"
        :index="index"
        :draggable-active="showWidgetManager"
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
