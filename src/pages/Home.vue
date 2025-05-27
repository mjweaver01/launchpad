<template>
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 p-4 sm:p-6 gap-4 sm:gap-6 w-full">
    <WeatherWidget />
    <CalendarWidget />
    <NewsWidget />
    <TodoWidget />
    <SearchWidget />
    <WaterReminderWidget />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WeatherWidget from '../components/widgets/WeatherWidget.vue';
import NewsWidget from '../components/widgets/NewsWidget.vue';
import TodoWidget from '../components/widgets/TodoWidget.vue';
import SearchWidget from '../components/widgets/SearchWidget.vue';
import CalendarWidget from '../components/widgets/CalendarWidget.vue';
import WaterReminderWidget from '../components/widgets/WaterReminderWidget.vue';

export default defineComponent({
  name: 'Home',
  components: {
    WeatherWidget,
    NewsWidget,
    TodoWidget,
    SearchWidget,
    CalendarWidget,
    WaterReminderWidget,
  },
  setup() {
    return {};
  },
});
</script>
