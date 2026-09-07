import type { WidgetId } from '../store/widgetStore';

export type WidgetLayout =
  | 'none'
  | 'single'
  | 'split';

export interface WidgetOrchestration {
  layout: WidgetLayout;
  primary: WidgetId | null;
  secondary: WidgetId | null;
}

const WIDGET_PRIORITY: Record<
  WidgetId,
  number
> = {
  focusTimer: 3,
  media: 2,
  telemetry: 1,
};

function sortByPriority(
  widgets: WidgetId[],
): WidgetId[] {
  return [...widgets].sort(
    (a, b) =>
      WIDGET_PRIORITY[b] -
      WIDGET_PRIORITY[a],
  );
}

export function orchestrateWidgets(
  activeWidgets: WidgetId[],
): WidgetOrchestration {
  const uniqueWidgets = Array.from(
    new Set(activeWidgets),
  );

  if (uniqueWidgets.length === 0) {
    return {
      layout: 'none',
      primary: null,
      secondary: null,
    };
  }

  const ordered =
    sortByPriority(uniqueWidgets);

  if (ordered.length === 1) {
    return {
      layout: 'single',
      primary: ordered[0],
      secondary: null,
    };
  }

  return {
    layout: 'split',
    primary: ordered[0],
    secondary: ordered[1],
  };
}