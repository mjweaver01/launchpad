<script setup lang="ts">
import type { Component } from 'vue';

withDefaults(
  defineProps<{
    icon: Component;
    label: string;
    spin?: boolean;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
  }>(),
  {
    spin: false,
    type: 'button',
    disabled: false,
  }
);
</script>

<template>
  <button
    class="ui-icon-btn"
    :type="type"
    :disabled="disabled"
    :aria-label="label"
    :data-tooltip="label"
  >
    <component :is="icon" :class="{ 'animate-spin': spin }" />
  </button>
</template>
