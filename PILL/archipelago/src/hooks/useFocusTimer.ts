import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  TAURI_EVENTS,
  useTauriTypedEvent,
  type TimerTick,
} from '../lib/tauriEvents';

const DEFAULT_FOCUS_DURATION_SECS = 25 * 60;

interface FocusTimerState {
  secondsRemaining: number;
  isRunning: boolean;
}

export function useFocusTimer() {
  const [timer, setTimer] = useState<FocusTimerState>({
    secondsRemaining: DEFAULT_FOCUS_DURATION_SECS,
    isRunning: false,
  });

  useTauriTypedEvent(
    TAURI_EVENTS.TIMER_TICK,
    (payload: TimerTick) => {
      setTimer({
        secondsRemaining: payload.seconds_remaining,
        isRunning: payload.is_running,
      });
    },
  );

  const start = useCallback(async () => {
    try {
      const snapshot = await invoke<TimerTick>('start_focus_timer');

      setTimer({
        secondsRemaining: snapshot.seconds_remaining,
        isRunning: snapshot.is_running,
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
      const snapshot = await invoke<TimerTick>('pause_focus_timer');

      setTimer({
        secondsRemaining: snapshot.seconds_remaining,
        isRunning: snapshot.is_running,
      });
    } catch (error) {
      console.error(
        '[FocusTimer] Failed to pause timer:',
        error,
      );
    }
  }, []);

  const reset = useCallback(async () => {
    try {
      const snapshot = await invoke<TimerTick>('reset_focus_timer');

      setTimer({
        secondsRemaining: snapshot.seconds_remaining,
        isRunning: snapshot.is_running,
      });
    } catch (error) {
      console.error(
        '[FocusTimer] Failed to reset timer:',
        error,
      );
    }
  }, []);

  return {
    secondsRemaining: timer.secondsRemaining,
    isRunning: timer.isRunning,
    start,
    pause,
    reset,
  };
}