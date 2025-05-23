<template>
  <div class="bg-gray-100 min-h-screen">
    <AppHeader />
    <div class="py-8 px-4">
      <div class="max-w-3xl mx-auto">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AppHeader from './components/AppHeader.vue';

export default defineComponent({
  name: 'App',
  components: {
    AppHeader,
  },
});
</script>
