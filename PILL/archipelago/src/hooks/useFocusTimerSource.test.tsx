import {
  act,
  cleanup,
  renderHook,
} from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  FEATURE_EVENTS,
  subscribeToFeatureEvent,
  clearFeatureEventListeners,
} from '../lib/featureEvents';

import {
  TAURI_EVENTS,
  useTauriTypedEvent,
  type TimerTick,
} from '../lib/tauriEvents';

import {
  DEFAULT_FOCUS_DURATION_SECS,
  useFocusTimerStore,
} from '../store/focusTimerStore';

import { useFocusTimerSource } from './useFocusTimerSource';

vi.mock('../lib/tauriEvents', async () => {
  const actual = await vi.importActual<
    typeof import('../lib/tauriEvents')
  >('../lib/tauriEvents');

  return {
    ...actual,
    useTauriTypedEvent: vi.fn(),
  };
});

const mockedUseTauriTypedEvent =
  vi.mocked(useTauriTypedEvent);

let timerHandler:
  | ((payload: TimerTick) => void)
  | undefined;

beforeEach(() => {
  timerHandler = undefined;

  clearFeatureEventListeners();

  useFocusTimerStore.setState({
    secondsRemaining:
      DEFAULT_FOCUS_DURATION_SECS,
    isRunning: false,
    hasStarted: false,
  });

  mockedUseTauriTypedEvent.mockImplementation(
    (eventName, handler) => {
      if (
        eventName ===
        TAURI_EVENTS.TIMER_TICK
      ) {
        timerHandler =
          handler as (
            payload: TimerTick,
          ) => void;
      }
    },
  );
});

afterEach(() => {
  cleanup();
  clearFeatureEventListeners();
  vi.clearAllMocks();
});

function emitTimerTick(
  payload: TimerTick,
): void {
  if (!timerHandler) {
    throw new Error(
      'Timer tick handler was not registered',
    );
  }

  act(() => {
    timerHandler?.(payload);
  });
}

describe('useFocusTimerSource', () => {
  it('subscribes to timer ticks', () => {
    renderHook(() =>
      useFocusTimerSource(),
    );

    expect(
      mockedUseTauriTypedEvent,
    ).toHaveBeenCalledWith(
      TAURI_EVENTS.TIMER_TICK,
      expect.any(Function),
    );
  });

  it('updates the timer store from timer ticks', () => {
    renderHook(() =>
      useFocusTimerSource(),
    );

    emitTimerTick({
      seconds_remaining: 1234,
      is_running: true,
    });

    const state =
      useFocusTimerStore.getState();

    expect(
      state.secondsRemaining,
    ).toBe(1234);

    expect(state.isRunning).toBe(true);
    expect(state.hasStarted).toBe(true);
  });

  it('emits completion when the timer reaches zero', () => {
    const handler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.FOCUS_TIMER_COMPLETED,
        handler,
      );

    renderHook(() =>
      useFocusTimerSource(),
    );

    emitTimerTick({
      seconds_remaining: 1499,
      is_running: true,
    });

    emitTimerTick({
      seconds_remaining: 0,
      is_running: false,
    });

    const state =
      useFocusTimerStore.getState();

    expect(
      state.secondsRemaining,
    ).toBe(0);

    expect(state.isRunning).toBe(false);

    expect(handler).toHaveBeenCalledTimes(1);

    expect(handler).toHaveBeenCalledWith({
      seconds_remaining: 0,
    });

    unsubscribe();
  });

  it('emits completion only once for repeated zero-second ticks', () => {
    const handler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.FOCUS_TIMER_COMPLETED,
        handler,
      );

    renderHook(() =>
      useFocusTimerSource(),
    );

    emitTimerTick({
      seconds_remaining: 1499,
      is_running: true,
    });

    emitTimerTick({
      seconds_remaining: 0,
      is_running: false,
    });

    emitTimerTick({
      seconds_remaining: 0,
      is_running: false,
    });

    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});