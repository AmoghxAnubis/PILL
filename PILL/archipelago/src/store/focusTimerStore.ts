import { create } from 'zustand';

import type { TimerTick } from '../lib/tauriEvents';

export const DEFAULT_FOCUS_DURATION_SECS =
  25 * 60;

export type FocusTimerStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed';

interface FocusTimerStore {
  secondsRemaining: number;
  isRunning: boolean;
  hasStarted: boolean;

  setTimer: (
    secondsRemaining: number,
    isRunning: boolean,
    hasStarted: boolean,
  ) => void;

  resetTimer: (snapshot: TimerTick) => void;
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

export { getStatus };

export const useFocusTimerStore =
  create<FocusTimerStore>((set) => ({
    secondsRemaining:
      DEFAULT_FOCUS_DURATION_SECS,

    isRunning: false,

    hasStarted: false,

    setTimer: (
      secondsRemaining,
      isRunning,
      hasStarted,
    ) => {
      set({
        secondsRemaining,
        isRunning,
        hasStarted,
      });
    },

    resetTimer: (snapshot) => {
      set({
        secondsRemaining:
          snapshot.seconds_remaining,
        isRunning: snapshot.is_running,
        hasStarted: false,
      });
    },
  }));