import { useEffect } from 'react';

import { useWidgetOrchestrator } from './useWidgetOrchestrator';
import { useIslandState } from './useIslandState';
import { useIslandStore } from '../store/islandStore';

const COLLAPSE_GRACE_PERIOD_MS = 750;

export function useWidgetLayoutSync(): void {
  const { layout } =
    useWidgetOrchestrator();

  const state = useIslandStore(
    (islandState) => islandState.state,
  );

  const {
    transitionTo,
    scheduleCollapse,
  } = useIslandState();

  useEffect(() => {
    /*
     * Multiple active widgets use split mode.
     *
     * If the user is already viewing the expanded
     * dashboard, leave it expanded. Otherwise reveal
     * the split presentation automatically.
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
     * When leaving split mode, any remaining active
     * widget uses the compact presentation.
     */
    if (state === 'split') {
      if (layout === 'none') {
        void transitionTo('idle');
      } else {
        void transitionTo('compact');
      }

      return;
    }

    /*
     * A single active widget should reveal the
     * compact pill from the idle notch.
     */
    if (
      state === 'idle' &&
      layout !== 'none'
    ) {
      void transitionTo('compact');

      return;
    }

    /*
     * When the last widget disappears, do not collapse
     * immediately. Give the current event a short grace
     * period so transient feature changes do not cause
     * visible flicker.
     */
    if (
      layout === 'none' &&
      state === 'compact'
    ) {
      scheduleCollapse(
        COLLAPSE_GRACE_PERIOD_MS,
      );
    }
  }, [
    layout,
    state,
    transitionTo,
    scheduleCollapse,
  ]);
}