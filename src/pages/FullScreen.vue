<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  X,
  Layers,
  Sun,
  Lock,
  LockOpen,
  SunMoon,
  Settings2,
  Maximize,
  Minimize,
} from 'lucide-vue-next';
import { useWidgetStore, useFullScreenStore } from '../stores';
import { FULLSCREEN_LAYOUT_LIMITS, defaultFullScreenLayout } from '../stores/fullScreen';
import Popover from '../components/ui/Popover.vue';
import { usePopover } from '../composables/usePopover';
import ThemeSettings from '../components/ThemeSettings.vue';
import FullScreenSettings from '../components/FullScreenSettings.vue';
import { useWakeLock } from '../composables/useWakeLock';
import DraggableWidget from '../components/widgets/DraggableWidget.vue';
import WidgetView from '../components/widgets/WidgetView.vue';
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

// Layout: 1 widget fills the screen; 2 split it (side by side in landscape,
// stacked in portrait); 3+ fall back to a scrolling grid.
const landscapeQuery = window.matchMedia('(orientation: landscape)');
const isLandscape = ref(landscapeQuery.matches);
const onOrientationChange = (event: MediaQueryListEvent) => (isLandscape.value = event.matches);

// When the clock is one of two widgets, its share of the screen is set by
// dragging the divider between them (saved separately per orientation).
const pairHasClock = computed(
  () =>
    widgetCount.value === 2 && widgetStore.visibleWidgets.some(w => w.component === 'TimeWidget')
);
const clockIsFirst = computed(() => widgetStore.visibleWidgets[0]?.component === 'TimeWidget');
const splitKey = computed(() => (isLandscape.value ? 'clockWidth' : 'clockHeight'));
const clockShare = computed(() => fullScreenStore.layout[splitKey.value]);
const firstShare = computed(() => (clockIsFirst.value ? clockShare.value : 100 - clockShare.value));

const stageStyle = computed(() => ({
  '--fs-gap': `${fullScreenStore.layout.gap}px`,
  '--fs-padding': `${fullScreenStore.layout.padding}px`,
  '--fs-first-share': String(firstShare.value / 100),
  ...(pairHasClock.value
    ? {
        '--fs-pair-tracks': `minmax(0, ${firstShare.value}fr) minmax(0, ${100 - firstShare.value}fr)`,
      }
    : {}),
}));

// Divider drag. Pointer capture keeps the drag on the handle even when the
// finger moves fast; values snap to the store's step and stay in its limits.
const stageEl = ref<HTMLElement | null>(null);
const isDragging = ref(false);

const setClockShare = (value: number) => {
  const { min, max, step } = FULLSCREEN_LAYOUT_LIMITS[splitKey.value];
  const snapped = Math.min(max, Math.max(min, Math.round(value / step) * step));
  if (snapped !== clockShare.value) fullScreenStore.setLayout({ [splitKey.value]: snapped });
};

const startDrag = (event: PointerEvent) => {
  event.preventDefault();
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  isDragging.value = true;
  keepControls();
};

const onDrag = (event: PointerEvent) => {
  if (!isDragging.value || !stageEl.value) return;
  const rect = stageEl.value.getBoundingClientRect();
  const { padding, gap } = fullScreenStore.layout;
  const pos = isLandscape.value ? event.clientX - rect.left : event.clientY - rect.top;
  const size = isLandscape.value ? rect.width : rect.height;
  const first = ((pos - padding - gap / 2) / (size - padding * 2 - gap)) * 100;
  setClockShare(clockIsFirst.value ? first : 100 - first);
};

const endDrag = () => {
  if (!isDragging.value) return;
  isDragging.value = false;
  revealControls();
};

const resetSplit = () => setClockShare(defaultFullScreenLayout()[splitKey.value]);

const onDividerKey = (event: KeyboardEvent) => {
  const { step } = FULLSCREEN_LAYOUT_LIMITS[splitKey.value];
  const delta = { ArrowLeft: -step, ArrowUp: -step, ArrowRight: step, ArrowDown: step }[
    event.key as 'ArrowLeft'
  ];
  if (!delta) return;
  event.preventDefault();
  // Arrow keys move the divider; convert to the clock's share.
  setClockShare(clockShare.value + (clockIsFirst.value ? delta : -delta));
};

// Theme and layout popups from the control bar, one open at a time. The bar
// stays up while either is open.
type PopoverState = ReturnType<typeof usePopover>;
const themePopover = usePopover();
const layoutPopover = usePopover();
const isPopoverOpen = computed(() => themePopover.isOpen.value || layoutPopover.isOpen.value);
let popoverClosedAt = 0;

const togglePopover = (popover: PopoverState, other: PopoverState, event: MouseEvent) => {
  other.close();
  popover.toggle(event);
};

watch(isPopoverOpen, open => {
  if (open) return keepControls();
  popoverClosedAt = performance.now();
  revealControls();
});

const layoutClass = computed(() => {
  if (widgetCount.value === 1) return 'fs-layout-single';
  if (widgetCount.value === 2) return 'fs-layout-pair';
  return 'fs-layout-grid';
});

const revealControls = () => {
  showControls.value = true;
  if (controlsTimeout) clearTimeout(controlsTimeout);
  controlsTimeout = setTimeout(() => {
    // Stay up while a popup is open or the divider is being dragged.
    if (!isPopoverOpen.value && !isDragging.value) showControls.value = false;
  }, CONTROLS_TIMEOUT_MS);
};

const keepControls = () => {
  showControls.value = true;
  if (controlsTimeout) clearTimeout(controlsTimeout);
};

const hideControls = () => {
  showControls.value = false;
  if (controlsTimeout) clearTimeout(controlsTimeout);
};

// Browser fullscreen hides the URL bar and Android's system bars in a normal
// Chrome tab. It is only entered from the control bar button: requesting it on
// every tap also fired on the Exit button, and the request could finish after
// leaving this page, leaving the dashboard stuck in fullscreen.
// The installed app already launches fullscreen (manifest), so no button there.
const canUseBrowserFullscreen =
  document.fullscreenEnabled && !window.matchMedia('(display-mode: fullscreen)').matches;
const isBrowserFullscreen = ref(!!document.fullscreenElement);
let pendingFullscreen: Promise<void> | null = null;

const onFullscreenChange = () => (isBrowserFullscreen.value = !!document.fullscreenElement);

const toggleBrowserFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
    return;
  }
  pendingFullscreen = document.documentElement
    .requestFullscreen({ navigationUI: 'hide' })
    .catch(() => {
      /* denied or unsupported: the page still works in a normal window */
    })
    .finally(() => (pendingFullscreen = null));
};

/** Leave browser fullscreen, including a request that hasn't finished yet. */
const exitBrowserFullscreen = async () => {
  if (pendingFullscreen) await pendingFullscreen;
  if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
};

// Tap anywhere on the backdrop toggles the controls (touch devices have no
// mousemove). Taps inside widgets or the control bar are left alone.
const handleBackdropPointer = (event: PointerEvent) => {
  // A tap outside a popup just closes it (handled by the popup); don't also
  // toggle the control bar.
  if (performance.now() - popoverClosedAt < 100) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest('[data-fs-controls]')) return;
  if (target?.closest('button, a, input, select, textarea, [role="button"]')) return;
  if (showControls.value) hideControls();
  else revealControls();
};

const handleMouseMove = () => {
  if (!showControls.value) revealControls();
};

const exitFullScreen = async () => {
  fullScreenStore.remember(false);
  await exitBrowserFullscreen();
  router.push('/');
};

const handleKeydown = (event: KeyboardEvent) => {
  // Escape closes an open popup first (the popup handles it).
  if (isPopoverOpen.value || performance.now() - popoverClosedAt < 100) return;
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
  document.addEventListener('fullscreenchange', onFullscreenChange);
  landscapeQuery.addEventListener('change', onOrientationChange);
  fullScreenStore.initialize();
  fullScreenStore.remember(true);
  document.addEventListener('keydown', handleKeydown);
  revealControls();
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  landscapeQuery.removeEventListener('change', onOrientationChange);
  exitBrowserFullscreen();
  document.removeEventListener('keydown', handleKeydown);
  if (controlsTimeout) clearTimeout(controlsTimeout);
});
</script>

<template>
  <div
    class="fs-root fixed inset-0 bg-surface-2"
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
          <Sun class="h-4 w-4 shrink-0" />
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
          v-if="canUseBrowserFullscreen"
          class="rounded-lg p-1.5 hover:bg-white/15"
          :title="isBrowserFullscreen ? 'Show browser bars' : 'Hide browser bars'"
          :aria-label="isBrowserFullscreen ? 'Show browser bars' : 'Hide browser bars'"
          :aria-pressed="isBrowserFullscreen"
          @click="toggleBrowserFullscreen"
        >
          <component :is="isBrowserFullscreen ? Minimize : Maximize" class="h-4 w-4" />
        </button>
        <button
          class="rounded-lg p-1.5 hover:bg-white/15"
          :class="{ 'bg-white/15': themePopover.isOpen.value }"
          title="Theme"
          aria-label="Theme"
          :aria-expanded="themePopover.isOpen.value"
          @click="togglePopover(themePopover, layoutPopover, $event)"
        >
          <SunMoon class="h-4 w-4" />
        </button>
        <button
          class="rounded-lg p-1.5 hover:bg-white/15"
          :class="{ 'bg-white/15': layoutPopover.isOpen.value }"
          title="Layout"
          aria-label="Layout"
          :aria-expanded="layoutPopover.isOpen.value"
          @click="togglePopover(layoutPopover, themePopover, $event)"
        >
          <Settings2 class="h-4 w-4" />
        </button>

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

    <Popover
      :open="themePopover.isOpen.value"
      :anchor="themePopover.anchor.value"
      title="Theme"
      @close="themePopover.close"
    >
      <ThemeSettings />
    </Popover>
    <Popover
      :open="layoutPopover.isOpen.value"
      :anchor="layoutPopover.anchor.value"
      title="Layout"
      @close="layoutPopover.close"
    >
      <FullScreenSettings />
    </Popover>

    <div ref="stageEl" class="fs-stage" :class="layoutClass" :style="stageStyle">
      <DraggableWidget
        v-for="(widget, index) in widgetStore.visibleWidgets"
        :key="widget.id"
        :widget-id="widget.id"
        :index="index"
        :draggable-active="false"
        class="fs-cell"
      >
        <WidgetView :widget="widget" />
      </DraggableWidget>

      <!-- Resize handle between the clock and the other widget; shown with the controls -->
      <Transition name="fade">
        <div
          v-if="pairHasClock && (showControls || isDragging)"
          data-fs-controls
          class="fs-divider"
          :class="[isLandscape ? 'fs-divider-x' : 'fs-divider-y', { 'is-dragging': isDragging }]"
          role="separator"
          tabindex="0"
          :aria-orientation="isLandscape ? 'vertical' : 'horizontal'"
          aria-label="Resize widgets. Drag, or use arrow keys. Double-tap to reset."
          :aria-valuenow="clockShare"
          :aria-valuemin="FULLSCREEN_LAYOUT_LIMITS[splitKey].min"
          :aria-valuemax="FULLSCREEN_LAYOUT_LIMITS[splitKey].max"
          @pointerdown="startDrag"
          @pointermove="onDrag"
          @pointerup="endDrag"
          @pointercancel="endDrag"
          @lostpointercapture="endDrag"
          @dblclick="resetSplit"
          @keydown="onDividerKey"
        >
          <span class="fs-divider-grip" />
        </div>
      </Transition>

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

/* Hide scrollbars in full screen; content still scrolls by swipe. Older
   Android Chrome/WebView draws permanent scrollbars instead of fading ones.
   scrollbar-width covers Chrome 121+ and Firefox; ::-webkit-scrollbar covers
   older Chrome/WebView. :deep reaches into the widget components. */
.fs-root,
.fs-root :deep(*) {
  scrollbar-width: none;
}
.fs-root::-webkit-scrollbar,
.fs-root :deep(*::-webkit-scrollbar) {
  display: none;
}

.fs-stage {
  position: relative; /* anchors the resize handle */
  display: grid;
  /* Set from Settings > Full screen */
  gap: var(--fs-gap, 0.75rem);
  padding: var(--fs-padding, 0.75rem);
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
  grid-template-rows: var(--fs-pair-tracks, repeat(2, minmax(0, 1fr)));
}
@media (orientation: landscape) {
  .fs-layout-pair {
    grid-template-columns: var(--fs-pair-tracks, repeat(2, minmax(0, 1fr)));
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

.fs-divider {
  /* Centered on the gap between the two widgets. 100% is the stage's full
     size including its padding, matching how the grid splits the space. */
  --fs-divider-at: calc(
    var(--fs-padding) + (100% - 2 * var(--fs-padding) - var(--fs-gap)) * var(--fs-first-share) +
      var(--fs-gap) / 2
  );
  position: absolute;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none; /* let the drag move the handle, not scroll the page */
  outline: none;
}
.fs-divider-x {
  top: var(--fs-padding);
  bottom: var(--fs-padding);
  left: var(--fs-divider-at);
  width: 2.75rem; /* comfortable touch target */
  transform: translateX(-50%);
  cursor: col-resize;
}
.fs-divider-y {
  left: var(--fs-padding);
  right: var(--fs-padding);
  top: var(--fs-divider-at);
  height: 2.75rem;
  transform: translateY(-50%);
  cursor: row-resize;
}
.fs-divider-grip {
  border-radius: 999px;
  background: rgb(255 255 255 / 0.55);
  box-shadow: 0 0 0 1px rgb(0 0 0 / 0.35);
  transition:
    background 150ms ease,
    transform 150ms ease;
}
.fs-divider-x .fs-divider-grip {
  width: 6px;
  height: min(4.5rem, 40%);
}
.fs-divider-y .fs-divider-grip {
  height: 6px;
  width: min(4.5rem, 40%);
}
.fs-divider:hover .fs-divider-grip,
.fs-divider:focus-visible .fs-divider-grip,
.fs-divider.is-dragging .fs-divider-grip {
  background: rgb(255 255 255 / 0.9);
  transform: scale(1.15);
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
