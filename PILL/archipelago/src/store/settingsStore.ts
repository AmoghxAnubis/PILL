import { create } from 'zustand';
import { useIslandStore } from './islandStore';

import {
  DEFAULT_PILL_SETTINGS,
  type PillSettings,
} from '../../../shared/settings/PillSettings';

interface SettingsStore {
  settings: PillSettings;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  saveError: string | null;
  loadError: string | null;

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
    saveStatus: 'idle',
    saveError: null,
    loadError: null,

    setSettings: (settings) => {
      set((current) => {
        if (settings.revision < current.settings.revision) return current;
        useIslandStore.getState().setPinned(settings.behavior.pinExpanded);
        return { settings, loadError: null };
      });
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
