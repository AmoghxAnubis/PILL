import {
  useCallback,
  useRef,
  useState,
} from 'react';

import { invoke } from '@tauri-apps/api/core';

import {
  FEATURE_EVENTS,
  emitFeatureEvent,
} from '../lib/featureEvents';

import {
  TAURI_EVENTS,
  useTauriTypedEvent,
  type TimerTick,
} from '../lib/tauriEvents';

const DEFAULT_FOCUS_DURATION_SECS = 25 * 60;

export type FocusTimerStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed';

interface FocusTimerState {
  secondsRemaining: number;
  isRunning: boolean;
  hasStarted: boolean;
}

function getStatus(
  secondsRemaining: number,
  isRunning: boolean,
  hasStarted: boolean,
): FocusTimerStatus {
  if (!hasStarted) {
    return 'idle';
  }

  if (
    secondsRemaining === 0 &&
    !isRunning
  ) {
    return 'completed';
  }

  if (isRunning) {
    return 'running';
  }

  return 'paused';
}

export function useFocusTimer() {
  const [timer, setTimer] =
    useState<FocusTimerState>({
      secondsRemaining:
        DEFAULT_FOCUS_DURATION_SECS,
      isRunning: false,
      hasStarted: false,
    });

  /**
   * Tracks the last known status outside React state.
   *
   * This lets us emit lifecycle events synchronously
   * without relying on a state update completing first.
   */
  const statusRef =
    useRef<FocusTimerStatus>('idle');

  useTauriTypedEvent(
    TAURI_EVENTS.TIMER_TICK,
    (payload: TimerTick) => {
      const nextHasStarted =
        statusRef.current !== 'idle' ||
        payload.is_running ||
        payload.seconds_remaining <
          DEFAULT_FOCUS_DURATION_SECS;

      const nextStatus = getStatus(
        payload.seconds_remaining,
        payload.is_running,
        nextHasStarted,
      );

      const previousStatus =
        statusRef.current;

      statusRef.current = nextStatus;

      if (
        nextStatus === 'completed' &&
        previousStatus !== 'completed'
      ) {
        emitFeatureEvent(
          FEATURE_EVENTS.FOCUS_TIMER_COMPLETED,
          {
            seconds_remaining:
              payload.seconds_remaining,
          },
        );
      }

      setTimer((previous) => ({
        secondsRemaining:
          payload.seconds_remaining,
        isRunning: payload.is_running,
        hasStarted:
          previous.hasStarted ||
          payload.is_running ||
          payload.seconds_remaining <
            DEFAULT_FOCUS_DURATION_SECS,
      }));
    },
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

      statusRef.current = status;

      setTimer({
        secondsRemaining:
          snapshot.seconds_remaining,
        isRunning: snapshot.is_running,
        hasStarted: true,
      });

      if (snapshot.is_running) {
        emitFeatureEvent(
          FEATURE_EVENTS.FOCUS_TIMER_STARTED,
          {
            seconds_remaining:
              snapshot.seconds_remaining,
          },
        );
      }
    } catch (error) {
      console.error(
        '[FocusTimer] Failed to start timer:',
        error,
      );
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      const snapshot =
        await invoke<TimerTick>(
          'pause_focus_timer',
        );

      const previousStatus =
        statusRef.current;

      const nextStatus = getStatus(
        snapshot.seconds_remaining,
        snapshot.is_running,
        previousStatus !== 'idle',
      );

      statusRef.current = nextStatus;

      setTimer((previous) => ({
        secondsRemaining:
          snapshot.seconds_remaining,
        isRunning: snapshot.is_running,
        hasStarted:
          previous.hasStarted,
      }));

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
  }, []);

  const reset = useCallback(async () => {
    try {
      const snapshot =
        await invoke<TimerTick>(
          'reset_focus_timer',
        );

      statusRef.current = 'idle';

      setTimer({
        secondsRemaining:
          snapshot.seconds_remaining,
        isRunning: snapshot.is_running,
        hasStarted: false,
      });

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
  }, []);

  const status = getStatus(
    timer.secondsRemaining,
    timer.isRunning,
    timer.hasStarted,
  );

  return {
    secondsRemaining:
      timer.secondsRemaining,
    isRunning: timer.isRunning,
    status,
    start,
    pause,
    reset,
  };
}