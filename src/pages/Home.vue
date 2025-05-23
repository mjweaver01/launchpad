<template>
  <div>
    <div class="mb-8">
      <WeatherWidget />
    </div>

    <!-- @TODO create news component - use newsapi.org api -->

    <!-- @TODO create task list component (todo app using local storage) -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WeatherWidget from '../components/WeatherWidget.vue';

export default defineComponent({
  name: 'Home',
  components: {
    WeatherWidget,
  },
  setup() {
    return {};
  },
});
</script>
