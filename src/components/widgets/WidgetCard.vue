<script setup lang="ts">
import type { Component } from 'vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Maximize2 } from 'lucide-vue-next';
import IconButton from '../ui/IconButton.vue';

const props = defineProps<{
  title?: string;
  icon?: Component;
  widgetName?: string;
  displayName?: string;
  hideHeader?: boolean;
  bodyClass?: string;
}>();

const route = useRoute();

const inWidgetRoute = computed(() => route.path.includes('/widget'));
const isFullScreen = computed(() => route.name === 'Full Screen');

const showExpand = computed(
  () => !inWidgetRoute.value && !!props.widgetName && !!props.displayName
);

const showHeader = computed(() => !props.hideHeader && !isFullScreen.value);
</script>

<template>
  <section
    class="ui-card flex flex-col overflow-hidden h-full"
    :class="{
      'max-h-[calc(100vh-6rem)] lg:max-h-[calc(50vh-2rem)]': !inWidgetRoute && !isFullScreen,
      'max-h-[calc(100vh-2rem)] lg:max-h-[calc(33vh-1rem)]': isFullScreen,
    }"
  >
    <header
      v-if="showHeader && (title || icon || $slots.actions || showExpand)"
      class="ui-card-header"
    >
      <h2 class="ui-card-title">
        <component :is="icon" v-if="icon" class="ui-card-title-icon" />
        <span>{{ title }}</span>
      </h2>
      <div class="ui-card-actions">
        <slot name="actions" />
        <router-link
          v-if="showExpand"
          :to="`/widget/${widgetName}`"
          class="ui-icon-btn"
          :title="`View ${displayName} in full page`"
          :aria-label="`Expand ${displayName}`"
        >
          <Maximize2 />
        </router-link>
      </div>
    </header>
    <div class="ui-card-body flex-1 min-h-0 overflow-y-auto" :class="bodyClass">
      <slot />
    </div>
  </section>
</template>
