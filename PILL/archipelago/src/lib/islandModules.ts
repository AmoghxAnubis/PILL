import type { IslandModule } from '../store/islandStore';
import type { WidgetSettings } from '../../../shared/settings/PillSettings';

export const ISLAND_MODULES: ReadonlyArray<{
  id: IslandModule;
  label: string;
  widget?: keyof WidgetSettings;
}> = [
  { id: 'calendar', label: 'Calendar' },
  { id: 'weather', label: 'Weather' },
  { id: 'media', label: 'Media', widget: 'media' },
  { id: 'focusTimer', label: 'Focus', widget: 'focusTimer' },
  { id: 'telemetry', label: 'System', widget: 'telemetry' },
];

export function availableModules(settings: WidgetSettings) {
  return ISLAND_MODULES.filter((module) => !module.widget || settings[module.widget]);
}
