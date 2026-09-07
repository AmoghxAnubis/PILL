import { useEffect } from 'react';

import { useWidgetOrchestrator } from './useWidgetOrchestrator';
import { useIslandState } from './useIslandState';
import { useIslandStore } from '../store/islandStore';

/**
 * Synchronizes the Island state with the widget orchestration layer.
 *
 * Normal single-widget behavior remains controlled by the existing
 * Island state machine. The orchestration layer only takes control
 * when multiple widgets require split mode.
 *
 * All state transitions go through useIslandState so that React
 * state, native window dimensions, click-through state, and backend
 * notifications remain synchronized.
 */
export function useWidgetLayoutSync() {
  const { layout } = useWidgetOrchestrator();

  const state = useIslandStore(
    (islandState) => islandState.state,
  );

  const { transitionTo } = useIslandState();

  useEffect(() => {
    if (layout === 'split') {
      if (state !== 'split') {
        void transitionTo('split');
      }

      return;
    }

    if (state === 'split') {
      void transitionTo('compact');
    }
  }, [layout, state, transitionTo]);
}