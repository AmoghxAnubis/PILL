import { create } from 'zustand';

export type IslandState = 'idle' | 'compact' | 'expanded' | 'split';

interface IslandStore {
  /** Current visual state of the island */
  state: IslandState;
  /** Whether the island is visible (hidden during fullscreen apps) */
  visible: boolean;
  /** Active widgets to display (used for split state stacking) */
  activeWidgets: string[];

  setState: (state: IslandState) => void;
  setVisible: (visible: boolean) => void;
  addWidget: (widgetId: string) => void;
  removeWidget: (widgetId: string) => void;
}

/** Dimensions for each island state (in logical pixels) */
export const ISLAND_DIMENSIONS: Record<IslandState, { width: number; height: number }> = {
  idle:     { width: 110, height: 32 },
  compact:  { width: 220, height: 45 },
  expanded: { width: 360, height: 140 },
  split:    { width: 400, height: 50 },  // will be dynamic later
};

/** Spring physics config matching design spec: F = -k·x - c·v */
export const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 400,  // k = 400
  damping: 30,     // c = 30
};

export const useIslandStore = create<IslandStore>((set) => ({
  state: 'idle',
  visible: true,
  activeWidgets: [],

  setState: (state) => set({ state }),
  setVisible: (visible) => set({ visible }),
  addWidget: (widgetId) =>
    set((s) => ({
      activeWidgets: s.activeWidgets.includes(widgetId)
        ? s.activeWidgets
        : [...s.activeWidgets, widgetId],
    })),
  removeWidget: (widgetId) =>
    set((s) => ({
      activeWidgets: s.activeWidgets.filter((id) => id !== widgetId),
    })),
}));
