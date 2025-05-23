<template>
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
    <WeatherWidget />
    <NewsWidget />
    <TodoWidget />
    <SearchWidget />
    <CalendarWidget />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WeatherWidget from '../components/WeatherWidget.vue';
import NewsWidget from '../components/NewsWidget.vue';
import TodoWidget from '../components/TodoWidget.vue';
import SearchWidget from '../components/SearchWidget.vue';
import CalendarWidget from '../components/CalendarWidget.vue';

export default defineComponent({
  name: 'Home',
  components: {
    WeatherWidget,
    NewsWidget,
    TodoWidget,
    SearchWidget,
    CalendarWidget,
  },
  setup() {
    return {};
  },
});
</script>
