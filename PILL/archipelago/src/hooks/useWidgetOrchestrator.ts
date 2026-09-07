import { useMemo } from 'react';
import {
  orchestrateWidgets,
  type WidgetOrchestration,
} from '../lib/widgetOrchestrator';
import { useWidgetStore } from '../store/widgetStore';

export function useWidgetOrchestrator(): WidgetOrchestration {
  const activeWidgets = useWidgetStore(
    (state) => state.activeWidgets,
  );

  return useMemo(
    () => orchestrateWidgets(activeWidgets),
    [activeWidgets],
  );
}