<script setup lang="ts">
defineProps<{
  open: boolean;
  title?: string;
}>();

defineEmits<{ (e: 'close'): void }>();
</script>

<template>
  <Transition name="ui-modal">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center px-4"
      @click="$emit('close')"
    >
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        class="ui-card relative w-full max-w-md p-6"
        role="dialog"
        aria-modal="true"
        @click.stop
      >
        <h3
          v-if="title"
          class="text-base font-semibold text-[color:var(--color-fg)] mb-2"
        >
          {{ title }}
        </h3>
        <slot />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.ui-modal-enter-active,
.ui-modal-leave-active {
  transition: opacity 180ms ease;
}
.ui-modal-enter-active .ui-card,
.ui-modal-leave-active .ui-card {
  transition:
    transform 180ms ease,
    opacity 180ms ease;
}
.ui-modal-enter-from,
.ui-modal-leave-to {
  opacity: 0;
}
.ui-modal-enter-from .ui-card,
.ui-modal-leave-to .ui-card {
  opacity: 0;
  transform: scale(0.97) translateY(4px);
}
</style>
