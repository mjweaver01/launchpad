<template>
  <div>
    <div class="mb-8">
      <WeatherWidget />
    </div>

    <div class="mb-8">
      <NewsWidget />
    </div>

    <!-- @TODO create task list component (todo app using local storage) -->

    <!-- @TODO create "google" style web search using openai's web_search_preview tool -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WeatherWidget from '../components/WeatherWidget.vue';
import NewsWidget from '../components/NewsWidget.vue';

export default defineComponent({
  name: 'Home',
  components: {
    WeatherWidget,
    NewsWidget,
  },
  setup() {
    return {};
  },
});
</script>
