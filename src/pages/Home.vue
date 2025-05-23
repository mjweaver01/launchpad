<template>
  <div>
    <div class="text-center mb-10">
      <h1 class="text-4xl font-bold text-indigo-800 mb-2">Launchpad</h1>
      <p class="text-gray-600">Your personal assistant</p>
    </div>

    <!-- @TODO create weather component - use current location from browser and fetch weather data from openweathermap api -->

    <!-- @TODO create news component - use newsapi.org api -->

    <!-- @TODO create task list component (todo app using local storage) -->
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref } from 'vue';

export default defineComponent({
  name: 'Home',
  setup() {
    return {
      routes,
    };
  },
});
</script>
