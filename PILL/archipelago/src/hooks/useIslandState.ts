import { useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

import {
  useIslandStore,
  ISLAND_DIMENSIONS,
  type IslandState,
} from '../store/islandStore';

/**
 * Hook for managing Island state transitions.
 *
 * Handles:
 * - Island state changes
 * - native window resizing
 * - backend state notifications
 * - transition cleanup
 *
 * The Island remains natively interactive during normal operation.
 * Native click-through is reserved for fullscreen evasion.
 */
export function useIslandState() {
  const { state, setState } = useIslandStore();

  const collapseTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Transition to a new Island state.
   */
  const transitionTo = useCallback(
    async (newState: IslandState) => {
      if (state === newState) {
        return;
      }

      // Clear any pending auto-collapse.
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }

      const dims = ISLAND_DIMENSIONS[newState];

      setState(newState);

      try {
        // Resize the native window to match the frontend state.
        await invoke('resize_island', {
          width: dims.width,
          height: dims.height,
        });

        /**
         * Keep the native window interactive during normal
         * Island operation.
         *
         * Fullscreen evasion is responsible for enabling
         * native click-through when the Island is hidden.
         */
        await invoke('set_click_through', {
          enabled: false,
        });

        // Notify the backend of the state change.
        await invoke('notify_state_change', {
          state: newState,
        });
      } catch (err) {
        console.error(
          '[Island] Failed to transition:',
          err,
        );
      }
    },
    [setState, state],
  );

  /**
   * Auto-collapse back to idle after a delay.
   */
  const scheduleCollapse = useCallback(
    (delayMs: number = 2000) => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }

      collapseTimerRef.current = setTimeout(() => {
        void transitionTo('idle');
      }, delayMs);
    },
    [transitionTo],
  );

  /**
   * Handle mouse enter — transition from idle to compact.
   *
   * Split mode is owned by the widget orchestration layer and
   * should not be overridden by mouse interaction.
   */
  const handleMouseEnter = useCallback(() => {
    if (state === 'idle') {
      void transitionTo('compact');
    }
  }, [state, transitionTo]);

  /**
   * Handle mouse leave — transition from compact back to idle.
   *
   * Split mode is unaffected because it is not collapsed by
   * mouse-leave events.
   */
  const handleMouseLeave = useCallback(() => {
    if (state === 'compact') {
      void transitionTo('idle');
    }
  }, [state, transitionTo]);

  /**
   * Handle click — transition from compact to expanded.
   *
   * Split mode is intentionally not expanded through this path.
   */
  const handleClick = useCallback(() => {
    if (state === 'compact') {
      void transitionTo('expanded');
    }
  }, [state, transitionTo]);

  /**
   * Handle collapse.
   *
   * Expanded mode can be collapsed normally.
   * Split mode is managed by widget orchestration and therefore
   * cannot be manually collapsed while it is active.
   */
  const handleCollapse = useCallback(() => {
    if (state === 'expanded') {
      void transitionTo('idle');
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