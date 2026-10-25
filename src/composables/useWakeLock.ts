import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Keeps the screen awake while the component is mounted.
 * Uses the Screen Wake Lock API (Chrome on Android, desktop Chrome/Edge, Safari 16.4+).
 * The lock is dropped by the browser whenever the page is hidden, so it is
 * re-requested on every visibilitychange back to visible.
 */
export function useWakeLock() {
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const isActive = ref(false);
  const error = ref<string | null>(null);
  let sentinel: WakeLockSentinel | null = null;

  const request = async () => {
    if (!isSupported || document.visibilityState !== 'visible') return;
    if (sentinel && !sentinel.released) return;
    try {
      sentinel = await navigator.wakeLock.request('screen');
      isActive.value = true;
      error.value = null;
      sentinel.addEventListener('release', () => {
        isActive.value = false;
      });
    } catch (err) {
      // Typically NotAllowedError: battery saver on, or page not visible.
      error.value = err instanceof Error ? err.message : String(err);
      isActive.value = false;
    }
  };

  const release = async () => {
    try {
      await sentinel?.release();
    } catch {
      /* already released */
    }
    sentinel = null;
    isActive.value = false;
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') request();
  };

  onMounted(() => {
    request();
    document.addEventListener('visibilitychange', onVisibility);
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibility);
    release();
  });

  return { isSupported, isActive, error, request, release };
}
