import { useCallback } from 'react';

import { invoke } from '@tauri-apps/api/core';

import {
  FEATURE_EVENTS,
  emitFeatureEvent,
} from '../lib/featureEvents';

import {
  getStatus,
  useFocusTimerStore,
  type FocusTimerStatus,
} from '../store/focusTimerStore';

import type { TimerTick } from '../lib/tauriEvents';

export function useFocusTimer() {
  const secondsRemaining =
    useFocusTimerStore(
      (state) => state.secondsRemaining,
    );

  const isRunning =
    useFocusTimerStore(
      (state) => state.isRunning,
    );

  const hasStarted =
    useFocusTimerStore(
      (state) => state.hasStarted,
    );

  const setTimer =
    useFocusTimerStore(
      (state) => state.setTimer,
    );

  const resetTimer =
    useFocusTimerStore(
      (state) => state.resetTimer,
    );

  const start = useCallback(async () => {
    try {
      const snapshot =
        await invoke<TimerTick>(
          'start_focus_timer',
        );

      const status = getStatus(
        snapshot.seconds_remaining,
        snapshot.is_running,
        true,
      );

      setTimer(
        snapshot.seconds_remaining,
        snapshot.is_running,
        true,
      );

      if (snapshot.is_running) {
        emitFeatureEvent(
          FEATURE_EVENTS.FOCUS_TIMER_STARTED,
          {
            seconds_remaining:
              snapshot.seconds_remaining,
          },
        );
      }

      void status;
    } catch (error) {
      console.error(
        '[FocusTimer] Failed to start timer:',
        error,
      );
    }
  }, [setTimer]);

  const pause = useCallback(async () => {
    try {
      const snapshot =
        await invoke<TimerTick>(
          'pause_focus_timer',
        );

      const previousStatus =
        getStatus(
          secondsRemaining,
          isRunning,
          hasStarted,
        );

      const nextHasStarted =
        hasStarted;

      const nextStatus = getStatus(
        snapshot.seconds_remaining,
        snapshot.is_running,
        nextHasStarted,
      );

      setTimer(
        snapshot.seconds_remaining,
        snapshot.is_running,
        nextHasStarted,
      );

      if (
        previousStatus === 'running' &&
        nextStatus === 'paused'
      ) {
        emitFeatureEvent(
          FEATURE_EVENTS.FOCUS_TIMER_PAUSED,
          {
            seconds_remaining:
              snapshot.seconds_remaining,
          },
        );
      }

      if (
        nextStatus === 'completed' &&
        previousStatus !== 'completed'
      ) {
        emitFeatureEvent(
          FEATURE_EVENTS.FOCUS_TIMER_COMPLETED,
          {
            seconds_remaining:
              snapshot.seconds_remaining,
          },
        );
      }
    } catch (error) {
      console.error(
        '[FocusTimer] Failed to pause timer:',
        error,
      );
    }
  }, [
    hasStarted,
    isRunning,
    secondsRemaining,
    setTimer,
  ]);

  const reset = useCallback(async () => {
    try {
      const snapshot =
        await invoke<TimerTick>(
          'reset_focus_timer',
        );

      resetTimer(snapshot);

      emitFeatureEvent(
        FEATURE_EVENTS.FOCUS_TIMER_RESET,
        {
          seconds_remaining:
            snapshot.seconds_remaining,
        },
      );
    } catch (error) {
      console.error(
        '[FocusTimer] Failed to reset timer:',
        error,
      );
    }
  }, [resetTimer]);

  const status: FocusTimerStatus =
    getStatus(
      secondsRemaining,
      isRunning,
      hasStarted,
    );

  return {
    secondsRemaining,
    isRunning,
    status,
    start,
    pause,
    reset,
  };
}