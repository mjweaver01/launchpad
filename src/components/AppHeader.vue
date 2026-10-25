<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Rocket, RefreshCw, SunMoon, House, Fullscreen } from 'lucide-vue-next';
import { useWeatherStore, useNewsStore, useCalendarStore } from '../stores';
import { usePopover } from '../composables/usePopover';
import IconButton from './ui/IconButton.vue';
import Popover from './ui/Popover.vue';
import ThemeSettings from './ThemeSettings.vue';

const route = useRoute();
const router = useRouter();
const weatherStore = useWeatherStore();
const newsStore = useNewsStore();
const calendarStore = useCalendarStore();

const themePopover = usePopover();
const themeButton = ref<InstanceType<typeof IconButton> | null>(null);

const navLinks = [
  { to: '/', label: 'Home', icon: House },
  { to: '/fullscreen', label: 'Full screen', icon: Fullscreen },
];

const isRefreshing = ref(false);
const handleRefresh = async () => {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  try {
    await Promise.all([weatherStore.refresh(), newsStore.refresh(), calendarStore.refresh()]);
  } catch (error) {
    console.error('Failed to refresh data:', error);
  } finally {
    isRefreshing.value = false;
  }
};

// The old /settings page redirects to /?theme=1: open the theme popup, then
// drop the query so a reload doesn't reopen it.
watch(
  () => route.query.theme,
  async value => {
    if (!value) return;
    await nextTick();
    themePopover.open(themeButton.value?.$el ?? null);
    const { theme: _theme, ...rest } = route.query;
    router.replace({ query: rest });
  },
  { immediate: true }
);
</script>

<template>
  <header class="sticky top-0 z-50 backdrop-blur-md bg-surface/85 border-b border-border">
    <div class="mx-auto max-w-7xl px-4 sm:px-6">
      <div class="flex h-14 items-center justify-between gap-3">
        <router-link to="/" class="flex items-center gap-2 text-fg no-underline">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Rocket class="h-4 w-4" />
          </span>
          <span class="font-display text-base font-semibold tracking-tight">Launchpad</span>
        </router-link>

        <nav class="flex items-center gap-1" aria-label="Main">
          <router-link
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="ui-icon-btn"
            :class="{ 'bg-surface-2 text-fg!': route.path === link.to }"
            :aria-label="link.label"
            :data-tooltip="link.label"
          >
            <component :is="link.icon" />
          </router-link>
          <IconButton
            ref="themeButton"
            :icon="SunMoon"
            label="Theme"
            :aria-expanded="themePopover.isOpen.value"
            @click="themePopover.toggle"
          />
          <IconButton
            :icon="RefreshCw"
            :spin="isRefreshing"
            :disabled="isRefreshing"
            label="Refresh all data"
            @click="handleRefresh"
          />
        </nav>
      </div>
    </div>

    <Popover
      :open="themePopover.isOpen.value"
      :anchor="themePopover.anchor.value"
      title="Theme"
      @close="themePopover.close"
    >
      <ThemeSettings />
    </Popover>
  </header>
</template>
