import { useCallback, useEffect } from 'react';
import { useIslandStore } from '../store/islandStore';
import { useSettingsStore } from '../store/settingsStore';
import { persistPin } from '../lib/settingsActions';
import {
  cancelCollapse, getCollapsedState, retainIslandCoordinator,
  scheduleIslandCollapse, transitionIsland,
} from '../lib/islandCoordinator';

export function useIslandState() {
  useEffect(retainIslandCoordinator, []);
  const state = useIslandStore((island) => island.state);
  const hoverToExpand = useSettingsStore((store) => store.settings.behavior.hoverToExpand);
  const clickToExpand = useSettingsStore((store) => store.settings.behavior.clickToExpand);
  const autoCollapse = useSettingsStore((store) => store.settings.behavior.autoCollapse);
  const collapseDelayMs = useSettingsStore((store) => store.settings.behavior.collapseDelayMs);
  useEffect(() => { if (!autoCollapse) cancelCollapse(); }, [autoCollapse]);

  const handleMouseEnter = useCallback(() => {
    // Re-entering an already expanded island cancels any caller's collapse.
    cancelCollapse();
    if (hoverToExpand) void transitionIsland('expanded');
  }, [hoverToExpand]);

  const handleMouseLeave = useCallback(() => {
    if (!autoCollapse || useIslandStore.getState().pinned || useIslandStore.getState().menuOpen) return;
    scheduleIslandCollapse(collapseDelayMs);
  }, [autoCollapse, collapseDelayMs]);

  const handleClick = useCallback(() => {
    if (clickToExpand && useIslandStore.getState().state !== 'expanded') {
      void transitionIsland('expanded');
    }
  }, [clickToExpand]);

  const handleCollapse = useCallback(() => {
    if (useIslandStore.getState().state !== 'expanded') return;
    if (useIslandStore.getState().pinned) persistPin(false);
    void transitionIsland(getCollapsedState());
  }, []);

  return {
    state, transitionTo: transitionIsland, scheduleCollapse: scheduleIslandCollapse,
    handleMouseEnter, handleMouseLeave, handleClick, handleCollapse,
  };
}
