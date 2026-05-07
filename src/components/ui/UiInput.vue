<script setup lang="ts">
defineOptions({ inheritAttrs: false });

defineProps<{
  modelValue?: string | number;
  label?: string;
  id?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', v: string | number): void;
}>();
</script>

<template>
  <label v-if="label" class="ui-label" :for="id">{{ label }}</label>
  <input
    :id="id"
    v-bind="$attrs"
    :value="modelValue"
    class="ui-input"
    @input="
      $emit(
        'update:modelValue',
        ($event.target as HTMLInputElement).type === 'number'
          ? Number(($event.target as HTMLInputElement).value)
          : ($event.target as HTMLInputElement).value
      )
    "
  />
</template>
