<template>
  <header class="bg-indigo-800 text-white shadow-md">
    <div class="mx-auto px-4 py-3">
      <div class="flex justify-between items-center">
        <router-link to="/" class="font-bold text-xl">🚀 Launchpad</router-link>

        <nav class="flex space-x-4">
          <router-link
            v-for="route in routes"
            :key="route.path"
            :to="route.path"
            class="px-3 py-2 rounded hover:bg-indigo-700 transition-colors"
            :class="{ 'bg-indigo-700': $route.path === route.path }"
          >
            {{ route.name }}
          </router-link>
        </nav>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { routes } from '../router';

export default defineComponent({
  name: 'AppHeader',
  setup() {
    return {
      routes,
    };
  },
});
</script>
