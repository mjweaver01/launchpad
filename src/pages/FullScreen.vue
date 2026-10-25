<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { X, Layers, Sun, Lock, LockOpen } from 'lucide-vue-next';
import { useWidgetStore, useFullScreenStore } from '../stores';
import { useWakeLock } from '../composables/useWakeLock';
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

const CONTROLS_TIMEOUT_MS = 4000;

const widgetStore = useWidgetStore();
const fullScreenStore = useFullScreenStore();
const router = useRouter();
const wakeLock = useWakeLock();

const showControls = ref(false);
let controlsTimeout: ReturnType<typeof setTimeout> | null = null;

const widgetCount = computed(() => widgetStore.visibleWidgets.length);

// 1 widget fills the screen; 2 split it (side by side in landscape, stacked in
// portrait); 3+ fall back to a scrolling grid.
const layoutClass = computed(() => {
  if (widgetCount.value === 1) return 'fs-layout-single';
  if (widgetCount.value === 2) return 'fs-layout-pair';
  return 'fs-layout-grid';
});

const revealControls = () => {
  showControls.value = true;
  if (controlsTimeout) clearTimeout(controlsTimeout);
  controlsTimeout = setTimeout(() => (showControls.value = false), CONTROLS_TIMEOUT_MS);
};

const hideControls = () => {
  showControls.value = false;
  if (controlsTimeout) clearTimeout(controlsTimeout);
};

// Tap anywhere on the backdrop toggles the controls (touch devices have no
// mousemove). Taps inside widgets or the control bar are left alone.
const handleBackdropPointer = (event: PointerEvent) => {
  const target = event.target as HTMLElement | null;
  if (target?.closest('[data-fs-controls]')) return;
  if (target?.closest('button, a, input, select, textarea, [role="button"]')) return;
  if (showControls.value) hideControls();
  else revealControls();
};

const handleMouseMove = () => {
  if (!showControls.value) revealControls();
};

const exitFullScreen = () => {
  fullScreenStore.remember(false);
  router.push('/');
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') exitFullScreen();
};

// The slider shows brightness (right = brighter); the store keeps the dim
// amount, which is the overlay opacity.
const onBrightnessInput = (event: Event) => {
  fullScreenStore.setDim(1 - Number((event.target as HTMLInputElement).value));
  revealControls();
};

const wakeLockLabel = computed(() => {
  if (!wakeLock.isSupported) return 'Screen wake lock not supported here';
  if (wakeLock.isActive.value) return 'Screen will stay awake';
  return wakeLock.error.value
    ? `Wake lock unavailable: ${wakeLock.error.value}`
    : 'Tap to keep screen awake';
});

onMounted(() => {
  fullScreenStore.initialize();
  fullScreenStore.remember(true);
  document.addEventListener('keydown', handleKeydown);
  revealControls();
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  if (controlsTimeout) clearTimeout(controlsTimeout);
});
</script>

<template>
  <div
    class="fs-root fixed inset-0 bg-[color:var(--color-surface-2)]"
    :class="{ 'cursor-none': !showControls }"
    @pointerdown="handleBackdropPointer"
    @mousemove="handleMouseMove"
  >
    <Transition name="fade">
      <div
        v-show="showControls"
        data-fs-controls
        class="fixed top-3 right-3 left-3 sm:left-auto z-50 flex items-center gap-2 rounded-xl bg-black/50 dark:bg-white/10 px-3 py-2 text-white backdrop-blur-md"
      >
        <button
          class="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium hover:bg-white/15"
          :title="wakeLockLabel"
          :aria-label="wakeLockLabel"
          @click="wakeLock.request()"
        >
          <component :is="wakeLock.isActive.value ? Lock : LockOpen" class="h-4 w-4" />
          <span class="hidden sm:inline">{{ wakeLock.isActive.value ? 'Awake' : 'Sleep' }}</span>
        </button>

        <label class="flex items-center gap-2 flex-1 sm:flex-none min-w-0" title="Brightness">
          <Sun class="h-4 w-4 flex-shrink-0" />
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            :value="1 - fullScreenStore.dim"
            class="ui-range fs-dim-range"
            aria-label="Brightness"
            @input="onBrightnessInput"
          />
        </label>

        <button
          class="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium hover:bg-white/15"
          title="Exit full screen (ESC)"
          @click="exitFullScreen"
        >
          <X class="h-4 w-4" />
          Exit
        </button>
      </div>
    </Transition>

    <div class="fs-stage" :class="layoutClass">
      <DraggableWidget
        v-for="(widget, index) in widgetStore.visibleWidgets"
        :key="widget.id"
        :widget-id="widget.id"
        :index="index"
        :draggable-active="false"
        class="fs-cell"
      >
        <TimeWidget v-if="widget.component === 'TimeWidget'" :widget-id="widget.id" />
        <WeatherWidget v-else-if="widget.component === 'WeatherWidget'" />
        <NewsWidget v-else-if="widget.component === 'NewsWidget'" />
        <CalendarWidget v-else-if="widget.component === 'CalendarWidget'" />
        <TodoWidget v-else-if="widget.component === 'TodoWidget'" />
        <SearchWidget v-else-if="widget.component === 'SearchWidget'" />
        <WaterReminderWidget
          v-else-if="widget.component === 'WaterReminderWidget'"
          :widget-id="widget.id"
        />
      </DraggableWidget>

      <div v-if="widgetCount === 0" class="flex items-center justify-center min-h-[60vh] w-full">
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

    <!-- Software dimmer: browsers cannot change hardware brightness. -->
    <div
      v-if="fullScreenStore.dim > 0"
      class="fs-dimmer"
      :style="{ opacity: fullScreenStore.dim }"
      aria-hidden="true"
    ></div>
  </div>
</template>

<style scoped>
.fs-root {
  /* dvh tracks the visible area as Android's browser chrome shows/hides. */
  height: 100dvh;
  overflow: hidden;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
    env(safe-area-inset-left);
}

.fs-stage {
  display: grid;
  gap: 0.75rem;
  padding: 0.75rem;
  height: 100%;
  width: 100%;
}

.fs-cell {
  min-height: 0;
  min-width: 0;
}

.fs-layout-single {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
}

/* Two widgets: stacked in portrait, side by side in landscape. */
.fs-layout-pair {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: repeat(2, minmax(0, 1fr));
}
@media (orientation: landscape) {
  .fs-layout-pair {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: minmax(0, 1fr);
  }
}

.fs-layout-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(0, 1fr);
  overflow-y: auto;
}
@media (min-width: 1024px) {
  .fs-layout-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.fs-dim-range {
  width: 7rem;
  max-width: 100%;
  /* The bar is translucent dark; the default track color disappears on it. */
  background: rgba(255, 255, 255, 0.3);
}
@media (max-width: 640px) {
  .fs-dim-range {
    width: 100%;
  }
}

.fs-dimmer {
  position: fixed;
  inset: 0;
  z-index: 999; /* just under the red-hue overlay (1000) */
  background: #000;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
