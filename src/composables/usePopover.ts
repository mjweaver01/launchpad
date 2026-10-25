import { ref } from 'vue';

/** Open state and anchor element for a Popover opened from a button. */
export function usePopover() {
  const isOpen = ref(false);
  const anchor = ref<HTMLElement | null>(null);

  const open = (element: HTMLElement | null) => {
    anchor.value = element;
    isOpen.value = true;
  };

  const close = () => {
    isOpen.value = false;
  };

  /** Click handler for the anchor button: opens under it, or closes if open. */
  const toggle = (event: MouseEvent) => {
    if (isOpen.value) close();
    else open(event.currentTarget as HTMLElement);
  };

  return { isOpen, anchor, open, close, toggle };
}
