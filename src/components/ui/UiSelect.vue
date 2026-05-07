<script setup lang="ts">
defineOptions({ inheritAttrs: false });

defineProps<{
  modelValue?: string | number;
  options: Array<{ label: string; value: string | number }>;
  label?: string;
  id?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', v: string | number): void;
  (e: 'change', v: string | number): void;
}>();
</script>

<template>
  <label v-if="label" class="ui-label" :for="id">{{ label }}</label>
  <select
    :id="id"
    v-bind="$attrs"
    :value="modelValue"
    class="ui-input pr-8 cursor-pointer appearance-none bg-no-repeat bg-[right_0.625rem_center] bg-[length:1rem]"
    style="
      background-image: url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>&quot;);
    "
    @change="
      $emit('update:modelValue', ($event.target as HTMLSelectElement).value);
      $emit('change', ($event.target as HTMLSelectElement).value);
    "
  >
    <option v-for="opt in options" :key="opt.value" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>
