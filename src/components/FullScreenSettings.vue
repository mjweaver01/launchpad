<script setup lang="ts">
import { useFullScreenStore, FULLSCREEN_LAYOUT_LIMITS as LIMITS } from '../stores/fullScreen';
import UiButton from './ui/UiButton.vue';

/** Full screen layout controls, shown from the full screen control bar. */
const fullScreenStore = useFullScreenStore();

const onRange = (key: 'gap' | 'padding', event: Event) =>
  fullScreenStore.setLayout({ [key]: Number((event.target as HTMLInputElement).value) });
</script>

<template>
  <div class="space-y-4">
    <p class="text-xs text-fg-muted">
      Drag the handle between two widgets to resize them. Double-tap it to reset.
    </p>
    <div>
      <label class="ui-label flex justify-between" for="fs-gap">
        <span>Space between widgets</span>
        <span class="tabular-nums text-fg-muted">{{ fullScreenStore.layout.gap }}px</span>
      </label>
      <input
        id="fs-gap"
        type="range"
        class="ui-range"
        :min="LIMITS.gap.min"
        :max="LIMITS.gap.max"
        :step="LIMITS.gap.step"
        :value="fullScreenStore.layout.gap"
        @input="onRange('gap', $event)"
      />
    </div>
    <div>
      <label class="ui-label flex justify-between" for="fs-padding">
        <span>Edge padding</span>
        <span class="tabular-nums text-fg-muted">{{ fullScreenStore.layout.padding }}px</span>
      </label>
      <input
        id="fs-padding"
        type="range"
        class="ui-range"
        :min="LIMITS.padding.min"
        :max="LIMITS.padding.max"
        :step="LIMITS.padding.step"
        :value="fullScreenStore.layout.padding"
        @input="onRange('padding', $event)"
      />
    </div>
    <UiButton variant="ghost" size="sm" @click="fullScreenStore.resetLayout()">
      Reset layout
    </UiButton>
  </div>
</template>
