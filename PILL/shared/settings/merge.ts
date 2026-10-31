import type { PillSettings, SettingsPatch } from './PillSettings';

/** Optimistic rendering only; native storage validates and merges again. */
export function mergeSettings(current: PillSettings, patch: SettingsPatch): PillSettings {
  return {
    ...current,
    widgets: { ...current.widgets, ...patch.widgets },
    behavior: { ...current.behavior, ...patch.behavior },
    appearance: { ...current.appearance, ...patch.appearance },
    system: { ...current.system, ...patch.system },
    weather: { ...current.weather, ...patch.weather },
  };
}
