<script setup lang="ts">
import type { Component } from 'vue';
import { computed } from 'vue';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    size?: Size;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    leadingIcon?: Component;
    trailingIcon?: Component;
    block?: boolean;
  }>(),
  {
    variant: 'secondary',
    size: 'md',
    type: 'button',
    disabled: false,
    block: false,
  }
);

const classes = computed(() => [
  'ui-btn',
  `ui-btn-${props.variant}`,
  props.size === 'sm' && 'ui-btn-sm',
  props.size === 'lg' && 'ui-btn-lg',
  props.block && 'w-full',
]);
</script>

<template>
  <button :class="classes" :type="type" :disabled="disabled">
    <component :is="leadingIcon" v-if="leadingIcon" class="ui-btn-icon" />
    <slot />
    <component :is="trailingIcon" v-if="trailingIcon" class="ui-btn-icon" />
  </button>
</template>
