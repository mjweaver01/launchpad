<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue';

/**
 * Small popup anchored under the button that opened it. No backdrop: the page
 * stays visible and interactive, and changes show live. Closes on Escape or a
 * tap outside (taps on the anchor are left to the anchor's own toggle).
 */
const props = withDefaults(
  defineProps<{
    open: boolean;
    anchor: HTMLElement | null;
    title?: string;
    /** Preferred width in px; shrinks to fit narrow screens. */
    width?: number;
  }>(),
  { width: 320 }
);

const emit = defineEmits<{ (e: 'close'): void }>();

const EDGE = 8; // keep this far from the viewport edges
const panel = ref<HTMLElement | null>(null);
const style = ref<Record<string, string>>({});

const position = () => {
  const rect = props.anchor?.getBoundingClientRect();
  if (!rect) return;
  const width = Math.min(props.width, window.innerWidth - EDGE * 2);
  // Right-align with the anchor, clamped inside the viewport.
  const left = Math.min(Math.max(rect.right - width, EDGE), window.innerWidth - width - EDGE);
  const top = rect.bottom + 6;
  style.value = {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    maxHeight: `${window.innerHeight - top - EDGE}px`,
  };
};

const onPointerDown = (event: PointerEvent) => {
  const target = event.target as Node;
  if (panel.value?.contains(target) || props.anchor?.contains(target)) return;
  emit('close');
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close');
};

const listen = (on: boolean) => {
  if (on) {
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('resize', position);
  } else {
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('keydown', onKeydown);
    window.removeEventListener('resize', position);
  }
};

watch(
  () => props.open,
  async open => {
    listen(open);
    if (open) {
      position();
      await nextTick();
      position();
    }
  },
  { immediate: true }
);

onUnmounted(() => listen(false));
</script>

<template>
  <Teleport to="body">
    <Transition name="ui-popover">
      <div
        v-if="open"
        ref="panel"
        class="ui-popover ui-card"
        role="dialog"
        aria-modal="false"
        :aria-label="title"
        :style="style"
      >
        <h3 v-if="title" class="text-sm font-semibold text-fg mb-3">{{ title }}</h3>
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ui-popover {
  position: fixed;
  z-index: 70;
  overflow-y: auto;
  padding: 1rem 1.125rem 1.125rem;
  box-shadow: var(--shadow-popover);
}

.ui-popover-enter-active,
.ui-popover-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.ui-popover-enter-from,
.ui-popover-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
