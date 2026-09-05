import { create } from 'zustand';

export type IslandState = 'idle' | 'compact' | 'expanded' | 'split';

interface IslandStore {
  state: IslandState;
  visible: boolean;
  isEvasionActive: boolean;
  activeWidgets: string[];

  setState: (state: IslandState) => void;
  setVisible: (visible: boolean) => void;
  setEvasionActive: (active: boolean) => void;

  addWidget: (widgetId: string) => void;
  removeWidget: (widgetId: string) => void;
}

export const ISLAND_DIMENSIONS: Record<
  IslandState,
  { width: number; height: number }
> = {
  idle: {
    width: 110,
    height: 32,
  },
  compact: {
    width: 300,
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

export const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

export function isIslandVisible(
  visible: boolean,
  isEvasionActive: boolean,
): boolean {
  return visible && !isEvasionActive;
}

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
    set((current) => ({
      activeWidgets: current.activeWidgets.includes(widgetId)
        ? current.activeWidgets
        : [...current.activeWidgets, widgetId],
    })),

  removeWidget: (widgetId) =>
    set((current) => ({
      activeWidgets: current.activeWidgets.filter(
        (id) => id !== widgetId,
      ),
    })),
}));