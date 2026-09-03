import { useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useIslandStore, ISLAND_DIMENSIONS, IslandState } from '../store/islandStore';

/**
 * Hook for managing island state transitions.
 * Handles state changes, window resizing via Tauri IPC, and click-through toggling.
 */
export function useIslandState() {
  const { state, setState } = useIslandStore();
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Transition to a new state — resizes the native window and toggles click-through */
  const transitionTo = useCallback(async (newState: IslandState) => {
    // Clear any pending auto-collapse
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }

    const dims = ISLAND_DIMENSIONS[newState];
    setState(newState);

    try {
      // Resize the native window to match the animated frontend
      await invoke('resize_island', { width: dims.width, height: dims.height });
      // Only idle state is click-through
      await invoke('set_click_through', { enabled: newState === 'idle' });
      // Notify backend of state change for adaptive polling
      await invoke('notify_state_change', { state: newState });
    } catch (err) {
      console.error('[Island] Failed to transition:', err);
    }
  }, [setState]);

  /** Auto-collapse back to idle after a delay (used by transient alerts) */
  const scheduleCollapse = useCallback((delayMs: number = 2000) => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
    }
    collapseTimerRef.current = setTimeout(() => {
      transitionTo('idle');
    }, delayMs);
  }, [transitionTo]);

  /** Handle mouse enter — transition from idle to compact */
  const handleMouseEnter = useCallback(() => {
    if (state === 'idle') {
      transitionTo('compact');
    }
  }, [state, transitionTo]);

  /** Handle mouse leave — transition from compact back to idle */
  const handleMouseLeave = useCallback(() => {
    if (state === 'compact') {
      transitionTo('idle');
    }
  }, [state, transitionTo]);

  /** Handle click — transition from compact to expanded */
  const handleClick = useCallback(() => {
    if (state === 'compact') {
      transitionTo('expanded');
    }
  }, [state, transitionTo]);

  /** Handle collapse — transition from expanded back to idle */
  const handleCollapse = useCallback(() => {
    if (state === 'expanded' || state === 'split') {
      transitionTo('idle');
    }
  }, [state, transitionTo]);

  return {
    state,
    transitionTo,
    scheduleCollapse,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleCollapse,
  };
}
