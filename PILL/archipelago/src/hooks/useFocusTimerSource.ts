import { useRef } from 'react';

import {
  FEATURE_EVENTS,
  emitFeatureEvent,
} from '../lib/featureEvents';

import {
  recordTimerEvent,
} from '../lib/perfDiagnostics';

import {
  TAURI_EVENTS,
  useTauriTypedEvent,
  type TimerTick,
} from '../lib/tauriEvents';

import {
  DEFAULT_FOCUS_DURATION_SECS,
  getStatus,
  useFocusTimerStore,
  type FocusTimerStatus,
} from '../store/focusTimerStore';

export function useFocusTimerSource(): void {
  const setTimer = useFocusTimerStore(
    (state) => state.setTimer,
  );

  const statusRef =
    useRef<FocusTimerStatus>('idle');

  useTauriTypedEvent(
    TAURI_EVENTS.TIMER_TICK,
    (payload: TimerTick) => {
      recordTimerEvent();

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

      statusRef.current =
        nextStatus;

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

      setTimer(
        payload.seconds_remaining,
        payload.is_running,
        nextHasStarted,
      );
    },
  );
}