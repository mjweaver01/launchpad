<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Rocket, RefreshCw, Menu, X } from 'lucide-vue-next';
import { routes } from '../router';
import { useWeatherStore, useNewsStore, useCalendarStore } from '../stores';
import IconButton from './ui/IconButton.vue';

const route = useRoute();
const weatherStore = useWeatherStore();
const newsStore = useNewsStore();
const calendarStore = useCalendarStore();
const isRefreshing = ref(false);
const isMobileMenuOpen = ref(false);

const filteredRoutes = computed(() =>
  routes.filter(
    r => !r.path.includes('google') && r.path !== '/' && !r.path.includes('/widget')
  )
);

const showHomeLink = computed(() => route.path.includes('/widget'));
const hasNavItems = computed(() => filteredRoutes.value.length > 0 || showHomeLink.value);

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
</script>

<template>
  <header
    class="sticky top-0 z-50 backdrop-blur-md bg-[color:var(--color-surface)]/85 border-b border-[color:var(--color-border)]"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6">
      <div class="flex h-14 items-center justify-between gap-3">
        <router-link
          to="/"
          class="flex items-center gap-2 text-[color:var(--color-fg)] no-underline"
        >
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-brand-600)] text-white"
          >
            <Rocket class="h-4 w-4" />
          </span>
          <span class="font-display text-base font-semibold tracking-tight">Launchpad</span>
        </router-link>

        <!-- Desktop nav -->
        <nav class="hidden md:flex items-center gap-1">
          <router-link
            v-for="r in filteredRoutes"
            :key="r.path"
            :to="r.path"
            class="rounded-md px-3 py-1.5 text-sm font-medium text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-2)] transition-colors"
            :class="{
              '!text-[color:var(--color-fg)] bg-[color:var(--color-surface-2)]':
                $route.path === r.path,
            }"
          >
            {{ r.name }}
          </router-link>
          <router-link
            v-if="showHomeLink"
            to="/"
            class="rounded-md px-3 py-1.5 text-sm font-medium text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-2)] transition-colors"
          >
            Home
          </router-link>
        </nav>

        <!-- Right side -->
        <div class="flex items-center gap-1">
          <IconButton
            :icon="RefreshCw"
            :spin="isRefreshing"
            :disabled="isRefreshing"
            label="Refresh all data"
            @click="handleRefresh"
          />
          <IconButton
            v-if="hasNavItems"
            class="md:hidden"
            :icon="isMobileMenuOpen ? X : Menu"
            :label="isMobileMenuOpen ? 'Close menu' : 'Open menu'"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          />
        </div>
      </div>

      <!-- Mobile menu -->
      <Transition name="ui-mobile-menu">
        <nav
          v-if="isMobileMenuOpen && hasNavItems"
          class="md:hidden flex flex-col gap-1 pb-4 pt-1"
        >
          <router-link
            v-for="r in filteredRoutes"
            :key="r.path"
            :to="r.path"
            class="rounded-md px-3 py-2 text-sm font-medium text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-2)] transition-colors"
            :class="{
              '!text-[color:var(--color-fg)] bg-[color:var(--color-surface-2)]':
                $route.path === r.path,
            }"
            @click="isMobileMenuOpen = false"
          >
            {{ r.name }}
          </router-link>
          <router-link
            v-if="showHomeLink"
            to="/"
            class="rounded-md px-3 py-2 text-sm font-medium text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-2)] transition-colors"
            @click="isMobileMenuOpen = false"
          >
            Home
          </router-link>
        </nav>
      </Transition>
    </div>
  </header>
</template>

<style scoped>
.ui-mobile-menu-enter-active,
.ui-mobile-menu-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
  overflow: hidden;
}
.ui-mobile-menu-enter-from,
.ui-mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
