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

    <div class="mb-8">
      <CalendarWidget />
    </div>
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
