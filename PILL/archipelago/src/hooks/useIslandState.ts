import { useCallback, useRef } from 'react';

import { invoke } from '@tauri-apps/api/core';

import {
  useIslandStore,
  ISLAND_DIMENSIONS,
  type IslandState,
} from '../store/islandStore';

import { useWidgetStore } from '../store/widgetStore';

export function useIslandState() {
  const setState = useIslandStore(
    (islandState) => islandState.setState,
  );

  const activeWidgets = useWidgetStore(
    (widgetState) => widgetState.activeWidgets,
  );

  const collapseTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * The latest requested island state.
   *
   * React state can lag behind rapid event sequences, so
   * native synchronization uses this ref as the source of
   * truth for the most recent requested state.
   */
  const requestedStateRef =
    useRef<IslandState | null>(null);

  /*
   * Only one native synchronization loop may run at a time.
   */
  const nativeSyncRef =
    useRef<Promise<void> | null>(null);

  const getCollapsedState =
    useCallback((): IslandState => {
      if (activeWidgets.length === 0) {
        return 'idle';
      }

      if (activeWidgets.length === 1) {
        return 'compact';
      }

      return 'split';
    }, [activeWidgets.length]);

  const synchronizeNativeState =
    useCallback(async () => {
      if (nativeSyncRef.current) {
        return;
      }

      const run = async () => {
        while (
          requestedStateRef.current !== null
        ) {
          const targetState =
            requestedStateRef.current;

          requestedStateRef.current = null;

          const dims =
            ISLAND_DIMENSIONS[targetState];

          try {
            await invoke('resize_island', {
              width: dims.width,
              height: dims.height,
            });

            /*
             * A newer transition arrived while the
             * resize was in flight. Do not apply stale
             * click-through or notification state.
             */
            if (
              requestedStateRef.current !== null
            ) {
              continue;
            }

            await invoke('set_click_through', {
              enabled: false,
            });

            if (
              requestedStateRef.current !== null
            ) {
              continue;
            }

            await invoke(
              'notify_state_change',
              {
                state: targetState,
              },
            );
          } catch (err) {
            console.error(
              '[Island] Failed to sync native state:',
              err,
            );
          }
        }
      };

      const promise = run();

      nativeSyncRef.current = promise;

      try {
        await promise;
      } finally {
        nativeSyncRef.current = null;

        /*
         * A transition may have arrived just after
         * the loop finished its final iteration.
         */
        if (
          requestedStateRef.current !== null
        ) {
          void synchronizeNativeState();
        }
      }
    }, []);

  const transitionTo = useCallback(
    async (newState: IslandState) => {
      const currentState =
        useIslandStore.getState().state;

      if (currentState === newState) {
        return;
      }

      if (collapseTimerRef.current) {
        clearTimeout(
          collapseTimerRef.current,
        );
        collapseTimerRef.current = null;
      }

      /*
       * Update React/store state immediately so the UI
       * responds without waiting for native IPC.
       */
      setState(newState);

      /*
       * Record the latest state requested by the UI.
       * Native synchronization will always converge on
       * the newest request.
       */
      requestedStateRef.current = newState;

      void synchronizeNativeState();
    },
    [setState, synchronizeNativeState],
  );

  const scheduleCollapse = useCallback(
    (delayMs: number = 2000) => {
      if (collapseTimerRef.current) {
        clearTimeout(
          collapseTimerRef.current,
        );
      }

      collapseTimerRef.current =
        setTimeout(() => {
          void transitionTo(
            getCollapsedState(),
          );
        }, delayMs);
    }, [
      getCollapsedState,
      transitionTo,
    ]);

  const handleMouseEnter = useCallback(() => {
    const currentState =
      useIslandStore.getState().state;

    if (currentState === 'idle') {
      void transitionTo('compact');
      return;
    }

    if (currentState === 'split') {
      void transitionTo('expanded');
    }
  }, [transitionTo]);

  const handleMouseLeave = useCallback(() => {
    const currentState =
      useIslandStore.getState().state;

    if (
      currentState === 'compact' ||
      currentState === 'expanded'
    ) {
      void transitionTo(
        getCollapsedState(),
      );
    }
  }, [
    getCollapsedState,
    transitionTo,
  ]);

  const handleClick = useCallback(() => {
    const currentState =
      useIslandStore.getState().state;

    if (currentState === 'compact') {
      void transitionTo('expanded');
    }
  }, [transitionTo]);

  const handleCollapse = useCallback(() => {
    const currentState =
      useIslandStore.getState().state;

    if (currentState === 'expanded') {
      void transitionTo(
        getCollapsedState(),
      );
    }
  }, [
    getCollapsedState,
    transitionTo,
  ]);

  return {
    state:
      useIslandStore(
        (islandState) =>
          islandState.state,
      ),
    transitionTo,
    scheduleCollapse,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleCollapse,
  };
}