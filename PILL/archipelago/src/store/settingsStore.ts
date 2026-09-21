import { create } from 'zustand';

import {
  DEFAULT_PILL_SETTINGS,
  type PillSettings,
} from '../../../shared/settings/PillSettings';

interface SettingsStore {
  settings: PillSettings;

  setSettings: (
    settings: PillSettings,
  ) => void;

  updateWidgets: (
    widgets: Partial<PillSettings['widgets']>,
  ) => void;

  updateBehavior: (
    behavior: Partial<PillSettings['behavior']>,
  ) => void;

  updateAppearance: (
    appearance: Partial<PillSettings['appearance']>,
  ) => void;

  updateSystem: (
    system: Partial<PillSettings['system']>,
  ) => void;

  resetSettings: () => void;
}

export const useSettingsStore =
  create<SettingsStore>((set) => ({
    settings: DEFAULT_PILL_SETTINGS,

    setSettings: (settings) => {
      set({ settings });
    },

    updateWidgets: (widgets) => {
      set((state) => ({
        settings: {
          ...state.settings,
          widgets: {
            ...state.settings.widgets,
            ...widgets,
          },
        },
      }));
    },

    updateBehavior: (behavior) => {
      set((state) => ({
        settings: {
          ...state.settings,
          behavior: {
            ...state.settings.behavior,
            ...behavior,
          },
        },
      }));
    },

    updateAppearance: (appearance) => {
      set((state) => ({
        settings: {
          ...state.settings,
          appearance: {
            ...state.settings.appearance,
            ...appearance,
          },
        },
      }));
    },

    updateSystem: (system) => {
      set((state) => ({
        settings: {
          ...state.settings,
          system: {
            ...state.settings.system,
            ...system,
          },
        },
      }));
    },

    resetSettings: () => {
      set({
        settings: DEFAULT_PILL_SETTINGS,
      });
    },
  }));