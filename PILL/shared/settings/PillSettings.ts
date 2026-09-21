export type WidgetId =
  | 'media'
  | 'telemetry'
  | 'focusTimer';

export type ThemeMode =
  | 'dark'
  | 'light'
  | 'system';

export interface WidgetSettings {
  media: boolean;
  telemetry: boolean;
  focusTimer: boolean;
}

export interface BehaviorSettings {
  hoverToExpand: boolean;
  clickToExpand: boolean;
  autoCollapse: boolean;
  collapseDelayMs: number;
  fullscreenEvasion: boolean;
}

export interface AppearanceSettings {
  theme: ThemeMode;
  animations: boolean;
}

export interface SystemSettings {
  launchAtStartup: boolean;
  minimizeToTray: boolean;
}

export interface PillSettings {
  version: 1;

  widgets: WidgetSettings;

  behavior: BehaviorSettings;

  appearance: AppearanceSettings;

  system: SystemSettings;
}

export const DEFAULT_PILL_SETTINGS: PillSettings = {
  version: 1,

  widgets: {
    media: true,
    telemetry: true,
    focusTimer: true,
  },

  behavior: {
    hoverToExpand: true,
    clickToExpand: true,
    autoCollapse: true,
    collapseDelayMs: 750,
    fullscreenEvasion: true,
  },

  appearance: {
    theme: 'dark',
    animations: true,
  },

  system: {
    launchAtStartup: false,
    minimizeToTray: true,
  },
};