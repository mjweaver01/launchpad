<template>
  <div>
    <div class="mb-8">
      <WeatherWidget />
    </div>

    <div class="mb-8">
      <NewsWidget />
    </div>

    <div class="mb-8">
      <TodoWidget />
    </div>

    <!-- @TODO create "google" style web search using openai's web_search_preview tool -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WeatherWidget from '../components/WeatherWidget.vue';
import NewsWidget from '../components/NewsWidget.vue';
import TodoWidget from '../components/TodoWidget.vue';

export default defineComponent({
  name: 'Home',
  components: {
    WeatherWidget,
    NewsWidget,
    TodoWidget,
  },
  setup() {
    return {};
  },
});
</script>
