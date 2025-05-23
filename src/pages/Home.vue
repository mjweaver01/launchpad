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

    <div class="mb-8">
      <SearchWidget />
    </div>

    <!-- @TODO create "google" style web search using openai's web_search_preview tool -->

    <!-- @TODO create a calendar component that pulls events from google calendar -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WeatherWidget from '../components/WeatherWidget.vue';
import NewsWidget from '../components/NewsWidget.vue';
import TodoWidget from '../components/TodoWidget.vue';
import SearchWidget from '../components/SearchWidget.vue';

export default defineComponent({
  name: 'Home',
  components: {
    WeatherWidget,
    NewsWidget,
    TodoWidget,
    SearchWidget,
  },
  setup() {
    return {};
  },
});
</script>
