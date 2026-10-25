import { ref, type Ref } from 'vue';
import { useWidgetStore, getWidgetSize, COLUMN_SPANS, type WidgetSize } from '../stores/widgets';

/** Grid geometry read from the rendered grid, so it always matches the CSS. */
const measureGrid = (grid: HTMLElement) => {
  const style = getComputedStyle(grid);
  const columns = style.gridTemplateColumns.split(' ').length;
  const colGap = parseFloat(style.columnGap) || 0;
  const rowGap = parseFloat(style.rowGap) || 0;
  const rowHeight = parseFloat(style.gridAutoRows) || 0;
  const colWidth = (grid.getBoundingClientRect().width - colGap * (columns - 1)) / columns;
  return { colGap, rowGap, rowHeight, colWidth };
};

/**
 * Drag-to-resize for a widget in the dashboard grid. The pointer position is
 * converted to column and row spans (snapped by the widget store) while
 * dragging, so the widget reflows live. Arrow keys resize too.
 */
export function useGridResize(item: Ref<HTMLElement | undefined>, widgetId: () => string) {
  const widgetStore = useWidgetStore();
  const isResizing = ref(false);

  const currentSize = (): WidgetSize | null => {
    const widget = widgetStore.widgets.find(w => w.id === widgetId());
    return widget ? getWidgetSize(widget) : null;
  };

  const start = (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    isResizing.value = true;
  };

  const move = (event: PointerEvent) => {
    const grid = item.value?.parentElement;
    if (!isResizing.value || !item.value || !grid) return;
    const { colGap, rowGap, rowHeight, colWidth } = measureGrid(grid);
    if (!rowHeight || !colWidth) return;
    const rect = item.value.getBoundingClientRect();
    widgetStore.resizeWidget(widgetId(), {
      colSpan: (event.clientX - rect.left + colGap) / (colWidth + colGap),
      rowSpan: (event.clientY - rect.top + rowGap) / (rowHeight + rowGap),
    });
  };

  const end = () => {
    isResizing.value = false;
  };

  const reset = () => widgetStore.resetWidgetSize(widgetId());

  const onKeydown = (event: KeyboardEvent) => {
    const size = currentSize();
    if (!size) return;
    const spanIndex = COLUMN_SPANS.indexOf(size.colSpan as (typeof COLUMN_SPANS)[number]);
    const sizeForKey: Partial<Record<string, WidgetSize>> = {
      ArrowRight: {
        ...size,
        colSpan: COLUMN_SPANS[Math.min(spanIndex + 1, COLUMN_SPANS.length - 1)],
      },
      ArrowLeft: { ...size, colSpan: COLUMN_SPANS[Math.max(spanIndex - 1, 0)] },
      ArrowDown: { ...size, rowSpan: size.rowSpan + 1 },
      ArrowUp: { ...size, rowSpan: size.rowSpan - 1 },
    };
    const nextSize = sizeForKey[event.key];
    if (!nextSize) return;
    event.preventDefault();
    widgetStore.resizeWidget(widgetId(), nextSize);
  };

  return { isResizing, start, move, end, reset, onKeydown };
}
