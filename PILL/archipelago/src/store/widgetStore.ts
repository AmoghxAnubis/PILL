import { create } from 'zustand';

export type WidgetId =
  | 'media'
  | 'focusTimer'
  | 'telemetry';

interface WidgetStore {
  activeWidgets: WidgetId[];

  isWidgetActive: (
    widgetId: WidgetId,
  ) => boolean;

  /**
   * Explicitly sets the lifecycle state of a widget.
   *
   * Calling this repeatedly with the same value is a no-op.
   */
  setWidgetActive: (
    widgetId: WidgetId,
    active: boolean,
  ) => void;

  activateWidget: (
    widgetId: WidgetId,
  ) => void;

  deactivateWidget: (
    widgetId: WidgetId,
  ) => void;

  toggleWidget: (
    widgetId: WidgetId,
  ) => void;

  clearWidgets: () => void;
}

export const useWidgetStore =
  create<WidgetStore>((set, get) => ({
    activeWidgets: [],

    isWidgetActive: (widgetId) =>
      get().activeWidgets.includes(widgetId),

    setWidgetActive: (widgetId, active) => {
      set((state) => {
        const currentlyActive =
          state.activeWidgets.includes(
            widgetId,
          );

        if (currentlyActive === active) {
          return state;
        }

        if (active) {
          return {
            activeWidgets: [
              ...state.activeWidgets,
              widgetId,
            ],
          };
        }

        return {
          activeWidgets:
            state.activeWidgets.filter(
              (id) => id !== widgetId,
            ),
        };
      });
    },

    activateWidget: (widgetId) => {
      set((state) => {
        if (
          state.activeWidgets.includes(widgetId)
        ) {
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
      set((state) => {
        if (
          !state.activeWidgets.includes(
            widgetId,
          )
        ) {
          return state;
        }

        return {
          activeWidgets:
            state.activeWidgets.filter(
              (id) => id !== widgetId,
            ),
        };
      });
    },

    toggleWidget: (widgetId) => {
      set((state) => {
        if (
          state.activeWidgets.includes(widgetId)
        ) {
          return {
            activeWidgets:
              state.activeWidgets.filter(
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
      set((state) => {
        if (state.activeWidgets.length === 0) {
          return state;
        }

        return {
          activeWidgets: [],
        };
      });
    },
  }));