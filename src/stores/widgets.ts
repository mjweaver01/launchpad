import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useWidgetSettingsStore } from './widgetSettings';

export interface Widget {
  id: string;
  name: string;
  component: string;
  order: number;
  visible: boolean;
  /** Desktop dashboard width in grid columns; unset uses the default. */
  colSpan?: number;
  /** Desktop dashboard height in grid rows; unset uses the default for the widget type. */
  rowSpan?: number;
}

export interface WidgetSize {
  colSpan: number;
  rowSpan: number;
}

/** Column spans on the six-column desktop dashboard: a third, half, two thirds or full width. */
export const COLUMN_SPANS = [2, 3, 4, 6] as const;
// Three rows is the least that fits a card header, padding and a line of content.
export const ROW_SPAN_LIMITS = { min: 3, max: 16 } as const;

const DEFAULT_COL_SPAN = 2;
// Heights close to the old auto-sized cards, in grid rows.
const DEFAULT_ROW_SPANS: Record<string, number> = {
  TimeWidget: 4,
  SearchWidget: 6,
};
const FALLBACK_ROW_SPAN = 7;

/** Nearest allowed column span for a width measured in columns. */
export const snapColSpan = (columns: number): number =>
  COLUMN_SPANS.reduce((best, span) =>
    Math.abs(span - columns) < Math.abs(best - columns) ? span : best
  );

export const clampRowSpan = (rows: number): number =>
  Math.min(ROW_SPAN_LIMITS.max, Math.max(ROW_SPAN_LIMITS.min, Math.round(rows)));

export const defaultWidgetSize = (component: string): WidgetSize => ({
  colSpan: DEFAULT_COL_SPAN,
  rowSpan: DEFAULT_ROW_SPANS[component] ?? FALLBACK_ROW_SPAN,
});

/** A widget's size, falling back to the defaults for its type. */
export const getWidgetSize = (widget: Widget): WidgetSize => {
  const defaults = defaultWidgetSize(widget.component);
  return {
    colSpan: widget.colSpan ? snapColSpan(widget.colSpan) : defaults.colSpan,
    rowSpan: widget.rowSpan ? clampRowSpan(widget.rowSpan) : defaults.rowSpan,
  };
};

export const useWidgetStore = defineStore('widgets', () => {
  // Default widget configuration
  const defaultWidgets: Widget[] = [
    { id: 'time', name: 'Time', component: 'TimeWidget', order: 0, visible: true },
    { id: 'weather', name: 'Weather', component: 'WeatherWidget', order: 1, visible: true },
    { id: 'news', name: 'News', component: 'NewsWidget', order: 2, visible: true },
    { id: 'calendar', name: 'Calendar', component: 'CalendarWidget', order: 3, visible: true },
    { id: 'todo', name: 'Todo', component: 'TodoWidget', order: 4, visible: true },
    { id: 'search', name: 'Search', component: 'SearchWidget', order: 5, visible: true },
    {
      id: 'water-reminder',
      name: 'Water Reminder',
      component: 'WaterReminderWidget',
      order: 6,
      visible: true,
    },
  ];

  // Reactive state
  const widgets = ref<Widget[]>([]);
  const draggedWidget = ref<string | null>(null);
  const isDragging = ref(false);
  const dragOverIndex = ref<number | null>(null);

  const defaultWidgetIds = new Set(defaultWidgets.map(w => w.id));

  const getBaseWidgetId = (id: string): string => {
    const copyMatch = id.match(/^(.+)-copy-\d+$/);
    return copyMatch ? copyMatch[1] : id;
  };

  const generateDuplicateId = (sourceId: string): string => {
    const baseId = getBaseWidgetId(sourceId);
    let n = 1;
    while (widgets.value.some(w => w.id === `${baseId}-copy-${n}`)) {
      n += 1;
    }
    return `${baseId}-copy-${n}`;
  };

  const generateDuplicateName = (source: Widget): string => {
    const baseName =
      defaultWidgets.find(w => w.component === source.component)?.name ??
      source.name.replace(/\s+\(\d+\)$/, '');
    const count = widgets.value.filter(w => w.component === source.component).length;
    return `${baseName} (${count + 1})`;
  };

  // Load widgets from localStorage or use defaults
  const loadWidgets = () => {
    try {
      const stored = localStorage.getItem('widget-order');
      if (stored) {
        const parsedWidgets = JSON.parse(stored) as Widget[];
        // Ensure all default widgets are present with their latest configuration
        const mergedDefaults = defaultWidgets.map(defaultWidget => {
          const storedWidget = parsedWidgets.find(w => w.id === defaultWidget.id);
          return storedWidget ? { ...defaultWidget, ...storedWidget } : defaultWidget;
        });
        // Preserve duplicated / custom widget instances
        const extras = parsedWidgets.filter(w => !defaultWidgetIds.has(w.id));
        widgets.value = [...mergedDefaults, ...extras].sort((a, b) => a.order - b.order);
      } else {
        widgets.value = [...defaultWidgets];
      }
    } catch (error) {
      console.error('Failed to load widget order from localStorage:', error);
      widgets.value = [...defaultWidgets];
    }
  };

  // Save widgets to localStorage
  const saveWidgets = () => {
    try {
      localStorage.setItem('widget-order', JSON.stringify(widgets.value));
    } catch (error) {
      console.error('Failed to save widget order to localStorage:', error);
    }
  };

  // Computed properties
  const visibleWidgets = computed(() => {
    return widgets.value.filter(widget => widget.visible).sort((a, b) => a.order - b.order);
  });

  const hiddenWidgets = computed(() => {
    return widgets.value.filter(widget => !widget.visible);
  });

  // Actions
  const setDraggedWidget = (widgetId: string | null) => {
    draggedWidget.value = widgetId;
    isDragging.value = widgetId !== null;
  };

  const setDragOverIndex = (index: number | null) => {
    dragOverIndex.value = index;
  };

  const reorderWidgets = (fromIndex: number, toIndex: number) => {
    const visibleCount = visibleWidgets.value.length;
    const hiddenCount = hiddenWidgets.value.length;
    const totalCount = visibleCount + hiddenCount;

    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= totalCount ||
      toIndex >= totalCount
    ) {
      return;
    }

    // Create a combined array: visible widgets first, then hidden widgets
    const combinedWidgets = [...visibleWidgets.value, ...hiddenWidgets.value];

    // Reorder the combined array
    const [movedWidget] = combinedWidgets.splice(fromIndex, 1);
    combinedWidgets.splice(toIndex, 0, movedWidget);

    // Update the order property for all widgets
    combinedWidgets.forEach((widget, index) => {
      const originalWidget = widgets.value.find(w => w.id === widget.id);
      if (originalWidget) {
        originalWidget.order = index;
      }
    });

    saveWidgets();
  };

  const duplicateWidget = (widgetId: string) => {
    const source = widgets.value.find(w => w.id === widgetId);
    if (!source) {
      console.error('Widget not found:', widgetId);
      return;
    }

    const combined = [...visibleWidgets.value, ...hiddenWidgets.value];
    const sourceIndex = combined.findIndex(w => w.id === widgetId);
    const insertIndex = sourceIndex === -1 ? combined.length : sourceIndex + 1;

    const duplicate: Widget = {
      id: generateDuplicateId(source.id),
      name: generateDuplicateName(source),
      component: source.component,
      order: 0,
      visible: true,
      colSpan: source.colSpan,
      rowSpan: source.rowSpan,
    };

    widgets.value.push(duplicate);
    combined.splice(insertIndex, 0, duplicate);
    combined.forEach((widget, index) => {
      const original = widgets.value.find(w => w.id === widget.id);
      if (original) {
        original.order = index;
      }
    });

    useWidgetSettingsStore().copySettings(source.id, duplicate.id);
    saveWidgets();
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    const widget = widgets.value.find(w => w.id === widgetId);
    if (widget) {
      widget.visible = !widget.visible;

      // If hiding, move to end of order
      if (!widget.visible) {
        widget.order = Math.max(...widgets.value.map(w => w.order)) + 1;
      } else {
        // If showing, find a good position (at the end of visible widgets)
        const maxVisibleOrder = Math.max(
          ...widgets.value.filter(w => w.visible && w.id !== widgetId).map(w => w.order),
          -1
        );
        widget.order = maxVisibleOrder + 1;
      }

      saveWidgets();
    } else {
      console.error('Widget not found:', widgetId);
    }
  };

  const resizeWidget = (widgetId: string, size: WidgetSize) => {
    const widget = widgets.value.find(w => w.id === widgetId);
    if (!widget) return;
    const colSpan = snapColSpan(size.colSpan);
    const rowSpan = clampRowSpan(size.rowSpan);
    if (widget.colSpan === colSpan && widget.rowSpan === rowSpan) return;
    widget.colSpan = colSpan;
    widget.rowSpan = rowSpan;
    saveWidgets();
  };

  /** Back to the default size for the widget's type. */
  const resetWidgetSize = (widgetId: string) => {
    const widget = widgets.value.find(w => w.id === widgetId);
    if (!widget) return;
    delete widget.colSpan;
    delete widget.rowSpan;
    saveWidgets();
  };

  const resetToDefault = () => {
    try {
      // Clear any drag state first
      draggedWidget.value = null;
      isDragging.value = false;
      dragOverIndex.value = null;

      // Clear localStorage
      localStorage.removeItem('widget-order');
      useWidgetSettingsStore().pruneToWidgetIds(defaultWidgetIds);

      // Reset widgets to default configuration with fresh copies
      widgets.value.splice(
        0,
        widgets.value.length,
        ...defaultWidgets.map(widget => ({ ...widget }))
      );

      // Save the default state
      saveWidgets();

      console.log('Widgets reset to default successfully');
    } catch (error) {
      console.error('Failed to reset widgets to default:', error);
      // Fallback: force reload from defaults
      loadWidgets();
    }
  };

  // Initialize
  loadWidgets();

  return {
    // State
    widgets,
    draggedWidget,
    isDragging,
    dragOverIndex,

    // Computed
    visibleWidgets,
    hiddenWidgets,

    // Actions
    setDraggedWidget,
    setDragOverIndex,
    reorderWidgets,
    duplicateWidget,
    resizeWidget,
    resetWidgetSize,
    toggleWidgetVisibility,
    resetToDefault,
    loadWidgets,
    saveWidgets,
  };
});
