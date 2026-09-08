import { useEffect } from 'react';

import { useWidgetOrchestrator } from './useWidgetOrchestrator';
import { useIslandState } from './useIslandState';
import { useIslandStore } from '../store/islandStore';

export function useWidgetLayoutSync() {
  const { layout } = useWidgetOrchestrator();

  const state = useIslandStore(
    (islandState) => islandState.state,
  );

  const { transitionTo } = useIslandState();

  useEffect(() => {
    /*
     * Multiple widgets normally use split mode.
     *
     * Expanded is allowed to remain expanded while
     * multiple widgets are active so hover can reveal
     * the full dashboard.
     */
    if (layout === 'split') {
      if (
        state !== 'split' &&
        state !== 'expanded'
      ) {
        void transitionTo('split');
      }

      return;
    }

    /*
     * When leaving split mode, return to compact.
     */
    if (state === 'split') {
      if (layout === 'single') {
        void transitionTo('compact');
      } else {
        void transitionTo('idle');
      }

      return;
    }

    /*
     * If no widgets remain while compact, return to idle.
     */
    if (
      layout === 'none' &&
      state === 'compact'
    ) {
      void transitionTo('idle');
    }
  }, [
    layout,
    state,
    transitionTo,
  ]);
}