<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Check, X } from 'lucide-vue-next';
import { useCalendarStore } from '../stores';
import Spinner from '../components/ui/Spinner.vue';
import UiButton from '../components/ui/UiButton.vue';

const router = useRouter();
const route = useRoute();
const calendarStore = useCalendarStore();

const loading = ref(true);
const success = ref(false);
const error = ref('');

const goHome = () => router.push('/');

const handleCallback = async () => {
  try {
    const code = route.query.code as string;
    const errorParam = route.query.error as string;
    if (errorParam) throw new Error(`Authentication cancelled: ${errorParam}`);
    if (!code) throw new Error('No authorization code received');

    await calendarStore.handleAuthCallback(code);
    success.value = true;
    loading.value = false;
    setTimeout(() => router.push('/'), 1500);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred';
    loading.value = false;
  }
};

onMounted(handleCallback);
</script>

<template>
  <main class="min-h-screen flex items-center justify-center px-4">
    <div class="ui-card w-full max-w-sm p-8 text-center">
      <div v-if="loading" class="space-y-4">
        <Spinner :size="32" />
        <h2 class="text-base font-semibold text-[color:var(--color-fg)]">
          Connecting your calendar
        </h2>
        <p class="text-sm text-[color:var(--color-fg-muted)]">
          Please wait while we complete authentication.
        </p>
      </div>

      <div v-else-if="success" class="space-y-4">
        <div
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]"
        >
          <Check class="h-6 w-6" stroke-width="2.5" />
        </div>
        <h2 class="text-base font-semibold text-[color:var(--color-fg)]">Calendar connected</h2>
        <p class="text-sm text-[color:var(--color-fg-muted)]">Redirecting to your dashboard…</p>
      </div>

      <div v-else-if="error" class="space-y-4">
        <div
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]"
        >
          <X class="h-6 w-6" stroke-width="2.5" />
        </div>
        <h2 class="text-base font-semibold text-[color:var(--color-fg)]">Connection failed</h2>
        <p class="text-sm text-[color:var(--color-danger)]">{{ error }}</p>
        <UiButton variant="primary" @click="goHome">Back to dashboard</UiButton>
      </div>
    </div>
  </main>
</template>
