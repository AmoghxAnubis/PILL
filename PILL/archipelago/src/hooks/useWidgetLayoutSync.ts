import { useEffect } from 'react';

import { useWidgetOrchestrator } from './useWidgetOrchestrator';
import { useIslandState } from './useIslandState';
import { useIslandStore } from '../store/islandStore';

import {
  useSettingsStore,
} from '../store/settingsStore';

export function useWidgetLayoutSync(): void {
  const { layout } =
    useWidgetOrchestrator();

  const state = useIslandStore(
    (islandState) => islandState.state,
  );

  const autoCollapse = useSettingsStore(
    (settingsState) =>
      settingsState.settings.behavior
        .autoCollapse,
  );

  const collapseDelayMs = useSettingsStore(
    (settingsState) =>
      settingsState.settings.behavior
        .collapseDelayMs,
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
     * When the last widget disappears, optionally give
     * the current event a short grace period before
     * collapsing the pill.
     */
    if (
      layout === 'none' &&
      state === 'compact'
    ) {
      if (!autoCollapse) {
        /*
         * Re-entering the effect while auto-collapse is
         * disabled must cancel any previously scheduled
         * collapse.
         *
         * transitionTo() clears the pending timer before
         * checking whether the requested state is already
         * current.
         */
        void transitionTo('compact');

        return;
      }

      scheduleCollapse(
        collapseDelayMs,
      );
    }
  }, [
    layout,
    state,
    autoCollapse,
    collapseDelayMs,
    transitionTo,
    scheduleCollapse,
  ]);
}