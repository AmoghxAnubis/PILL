import { useMemo } from 'react';

import {
  orchestrateWidgets,
  type WidgetOrchestration,
} from '../lib/widgetOrchestrator';

import { useSettingsStore } from '../store/settingsStore';
import { useWidgetStore } from '../store/widgetStore';

export function useWidgetOrchestrator(): WidgetOrchestration {
  const activeWidgets = useWidgetStore(
    (state) => state.activeWidgets,
  );

  const widgetSettings = useSettingsStore(
    (state) => state.settings.widgets,
  );

  const enabledWidgets = useMemo(
    () =>
      activeWidgets.filter(
        (widgetId) =>
          widgetSettings[widgetId],
      ),
    [activeWidgets, widgetSettings],
  );

  return useMemo(
    () =>
      orchestrateWidgets(
        enabledWidgets,
      ),
    [enabledWidgets],
  );
}