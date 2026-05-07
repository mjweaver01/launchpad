<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next';
import UiButton from './UiButton.vue';

defineProps<{
  message: string;
  retryLabel?: string;
}>();

defineEmits<{ (e: 'retry'): void }>();
</script>

<template>
  <div class="text-center py-8">
    <div
      class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]"
    >
      <AlertTriangle class="h-6 w-6" />
    </div>
    <p class="text-sm text-[color:var(--color-fg-muted)] mb-4 max-w-sm mx-auto">{{ message }}</p>
    <UiButton variant="primary" size="sm" @click="$emit('retry')">
      {{ retryLabel ?? 'Try again' }}
    </UiButton>
  </div>
</template>
