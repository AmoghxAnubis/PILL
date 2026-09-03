import { create } from 'zustand';

export type IslandState = 'idle' | 'compact' | 'expanded' | 'split';

interface IslandStore {
  /** Current visual state of the island */
  state: IslandState;

  /** Whether the island is visible */
  visible: boolean;

  /** Whether the island is hidden because a fullscreen application is active */
  isEvasionActive: boolean;

  /** Active widgets to display (used for split state stacking) */
  activeWidgets: string[];

  setState: (state: IslandState) => void;
  setVisible: (visible: boolean) => void;
  setEvasionActive: (active: boolean) => void;
  addWidget: (widgetId: string) => void;
  removeWidget: (widgetId: string) => void;
}

/** Dimensions for each island state (in logical pixels) */
export const ISLAND_DIMENSIONS: Record<
  IslandState,
  { width: number; height: number }
> = {
  idle: {
    width: 110,
    height: 32,
  },
  compact: {
    width: 220,
    height: 45,
  },
  expanded: {
    width: 360,
    height: 140,
  },
  split: {
    width: 400,
    height: 50,
  },
};

/** Spring physics config matching design spec: F = -k·x - c·v */
export const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

export const useIslandStore = create<IslandStore>((set) => ({
  state: 'idle',
  visible: true,
  isEvasionActive: false,
  activeWidgets: [],

  setState: (state) => set({ state }),

  setVisible: (visible) => set({ visible }),

  setEvasionActive: (active) =>
    set({
      isEvasionActive: active,
    }),

  addWidget: (widgetId) =>
    set((s) => ({
      activeWidgets: s.activeWidgets.includes(widgetId)
        ? s.activeWidgets
        : [...s.activeWidgets, widgetId],
    })),

  removeWidget: (widgetId) =>
    set((s) => ({
      activeWidgets: s.activeWidgets.filter(
        (id) => id !== widgetId,
      ),
    })),
}));