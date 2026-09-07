import { useEffect } from 'react';

import { useWidgetOrchestrator } from './useWidgetOrchestrator';
import { useIslandStore } from '../store/islandStore';

/**
 * Synchronizes the island's visual state with the widget
 * orchestration layer.
 *
 * The normal idle → compact → expanded state machine remains
 * responsible for single-widget interactions. The orchestrator
 * only takes ownership when multiple widgets require split mode.
 */
export function useWidgetLayoutSync() {
  const { layout } = useWidgetOrchestrator();

  const state = useIslandStore(
    (islandState) => islandState.state,
  );

  const setState = useIslandStore(
    (islandState) => islandState.setState,
  );

  useEffect(() => {
    if (layout === 'split' && state !== 'split') {
      setState('split');
      return;
    }

    if (layout !== 'split' && state === 'split') {
      setState('compact');
    }
  }, [layout, state, setState]);
}