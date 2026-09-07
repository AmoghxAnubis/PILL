import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
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

  if (secondsRemaining === 0 && !isRunning) {
    return 'completed';
  }

  if (isRunning) {
    return 'running';
  }

  return 'paused';
}

export function useFocusTimer() {
  const [timer, setTimer] = useState<FocusTimerState>({
    secondsRemaining: DEFAULT_FOCUS_DURATION_SECS,
    isRunning: false,
    hasStarted: false,
  });

  useTauriTypedEvent(
    TAURI_EVENTS.TIMER_TICK,
    (payload: TimerTick) => {
      setTimer((previous) => ({
        secondsRemaining: payload.seconds_remaining,
        isRunning: payload.is_running,
        hasStarted:
          previous.hasStarted ||
          payload.is_running ||
          payload.seconds_remaining < DEFAULT_FOCUS_DURATION_SECS,
      }));
    },
  );

  const start = useCallback(async () => {
    try {
      const snapshot = await invoke<TimerTick>(
        'start_focus_timer',
      );

      setTimer({
        secondsRemaining: snapshot.seconds_remaining,
        isRunning: snapshot.is_running,
        hasStarted: true,
      });
    } catch (error) {
      console.error(
        '[FocusTimer] Failed to start timer:',
        error,
      );
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      const snapshot = await invoke<TimerTick>(
        'pause_focus_timer',
      );

      setTimer((previous) => ({
        secondsRemaining: snapshot.seconds_remaining,
        isRunning: snapshot.is_running,
        hasStarted: previous.hasStarted,
      }));
    } catch (error) {
      console.error(
        '[FocusTimer] Failed to pause timer:',
        error,
      );
    }
  }, []);

  const reset = useCallback(async () => {
    try {
      const snapshot = await invoke<TimerTick>(
        'reset_focus_timer',
      );

      setTimer({
        secondsRemaining: snapshot.seconds_remaining,
        isRunning: snapshot.is_running,
        hasStarted: false,
      });
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
    secondsRemaining: timer.secondsRemaining,
    isRunning: timer.isRunning,
    status,
    start,
    pause,
    reset,
  };
}