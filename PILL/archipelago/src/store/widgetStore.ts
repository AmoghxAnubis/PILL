import { create } from 'zustand';

export type WidgetId =
  | 'media'
  | 'focusTimer'
  | 'telemetry';

interface WidgetStore {
  activeWidgets: WidgetId[];

  isWidgetActive: (widgetId: WidgetId) => boolean;
  activateWidget: (widgetId: WidgetId) => void;
  deactivateWidget: (widgetId: WidgetId) => void;
  toggleWidget: (widgetId: WidgetId) => void;
  clearWidgets: () => void;
}

export const useWidgetStore = create<WidgetStore>((set, get) => ({
  activeWidgets: [],

  isWidgetActive: (widgetId) =>
    get().activeWidgets.includes(widgetId),

  activateWidget: (widgetId) => {
    set((state) => {
      if (state.activeWidgets.includes(widgetId)) {
        return state;
      }

      return {
        activeWidgets: [
          ...state.activeWidgets,
          widgetId,
        ],
      };
    });
  },

  deactivateWidget: (widgetId) => {
    set((state) => ({
      activeWidgets: state.activeWidgets.filter(
        (id) => id !== widgetId,
      ),
    }));
  },

  toggleWidget: (widgetId) => {
    set((state) => {
      if (state.activeWidgets.includes(widgetId)) {
        return {
          activeWidgets: state.activeWidgets.filter(
            (id) => id !== widgetId,
          ),
        };
      }

      return {
        activeWidgets: [
          ...state.activeWidgets,
          widgetId,
        ],
      };
    });
  },

  clearWidgets: () => {
    set({ activeWidgets: [] });
  },
}));