export type WidgetId = 'media' | 'telemetry' | 'focusTimer';
export type ThemeMode = 'dark' | 'light' | 'system' | 'graphite' | 'blue' | 'purple' | 'fluent';
export type IslandShape = 'pill' | 'panel';
export type TemperatureUnit = 'celsius' | 'fahrenheit';
export interface WidgetSettings { media: boolean; telemetry: boolean; focusTimer: boolean; }
export interface BehaviorSettings {
  hoverToExpand: boolean; clickToExpand: boolean; autoCollapse: boolean;
  collapseDelayMs: number; fullscreenEvasion: boolean; pinExpanded: boolean;
}
export interface AppearanceSettings {
  theme: ThemeMode; animations: boolean; opacity: number; scale: number; shape: IslandShape;
}
export interface SystemSettings { launchAtStartup: boolean; minimizeToTray: boolean; }
export interface WeatherLocation {
  id: number; name: string; region: string; country: string; latitude: number; longitude: number;
}
export interface WeatherSettings { enabled: boolean; location: WeatherLocation | null; unit: TemperatureUnit; }
export interface PillSettings {
  version: 2; revision: number; widgets: WidgetSettings; behavior: BehaviorSettings;
  appearance: AppearanceSettings; system: SystemSettings; weather: WeatherSettings;
}
export type SettingsPatch = {
  [Section in 'widgets' | 'behavior' | 'appearance' | 'system' | 'weather']?: Partial<PillSettings[Section]>;
};
export const DEFAULT_PILL_SETTINGS: PillSettings = {
  version: 2, revision: 0,
  widgets: { media: true, telemetry: true, focusTimer: true },
  behavior: {
    hoverToExpand: true, clickToExpand: true, autoCollapse: true,
    collapseDelayMs: 750, fullscreenEvasion: true, pinExpanded: false,
  },
  appearance: { theme: 'dark', animations: true, opacity: 1, scale: 1, shape: 'pill' },
  system: { launchAtStartup: false, minimizeToTray: true },
  weather: { enabled: false, location: null, unit: 'celsius' },
};
