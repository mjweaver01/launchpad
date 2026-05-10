<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';

const props = defineProps<{
  value: string;
}>();

const FLIP_DURATION_MS = 600;

// `topValue` drives the static top half (and the bottom flap that drops in).
// It is set to the new value as soon as the prop changes so the upper face
// reveals the new digit while the previous one falls away.
const topValue = ref(props.value);
// `bottomValue` drives the static bottom half (and the top flap that falls down).
// It only updates after the animation completes so the lower face shows the
// previous digit until the flap covers it.
const bottomValue = ref(props.value);
const flipping = ref(false);

let flipTimeout: ReturnType<typeof setTimeout> | null = null;
let resetTimeout: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.value,
  (newVal, oldVal) => {
    if (newVal === oldVal) return;

    if (flipTimeout) clearTimeout(flipTimeout);
    if (resetTimeout) clearTimeout(resetTimeout);

    bottomValue.value = oldVal;
    topValue.value = newVal;
    flipping.value = false;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        flipping.value = true;
      });
    });

    flipTimeout = setTimeout(() => {
      bottomValue.value = newVal;
      resetTimeout = setTimeout(() => {
        flipping.value = false;
      }, 30);
    }, FLIP_DURATION_MS);
  }
);

onUnmounted(() => {
  if (flipTimeout) clearTimeout(flipTimeout);
  if (resetTimeout) clearTimeout(resetTimeout);
});
</script>

<template>
  <div class="flip-digit" :class="{ flipping }" :aria-label="value">
    <div class="static-half top">
      <span>{{ topValue }}</span>
    </div>
    <div class="static-half bottom">
      <span>{{ bottomValue }}</span>
    </div>
    <div class="flap top-flap">
      <span>{{ bottomValue }}</span>
    </div>
    <div class="flap bottom-flap">
      <span>{{ topValue }}</span>
    </div>
  </div>
</template>

<style scoped>
.flip-digit {
  position: relative;
  display: inline-block;
  width: 1ch;
  height: 1em;
  perspective: 500px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.static-half,
.flap {
  position: absolute;
  left: 0;
  right: 0;
  height: 50%;
  overflow: hidden;
  background: var(--color-surface-3);
  color: var(--color-fg);
  display: flex;
  justify-content: center;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 0.05em;
}

.static-half.top,
.flap.top-flap {
  top: 0;
  align-items: flex-end;
  border-bottom: 1px solid color-mix(in oklch, var(--color-border) 70%, transparent);
}

.static-half.bottom,
.flap.bottom-flap {
  bottom: 0;
  align-items: flex-start;
}

.static-half.top span,
.flap.top-flap span {
  transform: translateY(50%);
}

.static-half.bottom span,
.flap.bottom-flap span {
  transform: translateY(-50%);
}

.flap.top-flap {
  transform-origin: 50% 100%;
  z-index: 3;
  transform: rotateX(0deg);
}

.flap.bottom-flap {
  transform-origin: 50% 0%;
  z-index: 3;
  transform: rotateX(90deg);
}

.flipping .flap.top-flap {
  animation: flip-down-top 0.3s cubic-bezier(0.55, 0.06, 0.68, 0.19) forwards;
  box-shadow: 0 0.06em 0.12em rgba(0, 0, 0, 0.25);
}

.flipping .flap.bottom-flap {
  animation: flip-down-bottom 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s forwards;
  box-shadow: 0 -0.06em 0.12em rgba(0, 0, 0, 0.25);
}

@keyframes flip-down-top {
  0% {
    transform: rotateX(0deg);
  }
  100% {
    transform: rotateX(-90deg);
  }
}

@keyframes flip-down-bottom {
  0% {
    transform: rotateX(90deg);
  }
  100% {
    transform: rotateX(0deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .flipping .flap.top-flap,
  .flipping .flap.bottom-flap {
    animation-duration: 0.01s;
    animation-delay: 0s;
  }
}
</style>
