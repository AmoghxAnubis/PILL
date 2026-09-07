import {
  act,
  renderHook,
} from '@testing-library/react';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { invoke } from '@tauri-apps/api/core';

import {
  FEATURE_EVENTS,
  subscribeToFeatureEvent,
} from '../lib/featureEvents';

import { useFocusTimer } from './useFocusTimer';

const listeners = new Map<
  string,
  (payload: unknown) => void
>();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('../lib/tauriEvents', async () => {
  const actual = await vi.importActual<
    typeof import('../lib/tauriEvents')
  >('../lib/tauriEvents');

  return {
    ...actual,
    useTauriTypedEvent: vi.fn(
      (
        eventName: string,
        handler: (payload: unknown) => void,
      ) => {
        listeners.set(eventName, handler);
      },
    ),
  };
});

const mockedInvoke = vi.mocked(invoke);

describe('useFocusTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
  });

  it('starts with a stopped 25 minute timer', () => {
    const { result } =
      renderHook(() => useFocusTimer());

    expect(
      result.current.secondsRemaining,
    ).toBe(25 * 60);

    expect(
      result.current.isRunning,
    ).toBe(false);

    expect(result.current.status).toBe(
      'idle',
    );
  });

  it('starts the native timer', async () => {
    mockedInvoke.mockResolvedValueOnce({
      seconds_remaining: 1499,
      is_running: true,
    });

    const { result } =
      renderHook(() => useFocusTimer());

    await act(async () => {
      await result.current.start();
    });

    expect(mockedInvoke).toHaveBeenCalledWith(
      'start_focus_timer',
    );

    expect(
      result.current.secondsRemaining,
    ).toBe(1499);

    expect(
      result.current.isRunning,
    ).toBe(true);

    expect(result.current.status).toBe(
      'running',
    );
  });

  it('pauses the native timer', async () => {
    mockedInvoke.mockResolvedValueOnce({
      seconds_remaining: 1200,
      is_running: false,
    });

    const { result } =
      renderHook(() => useFocusTimer());

    await act(async () => {
      await result.current.pause();
    });

    expect(mockedInvoke).toHaveBeenCalledWith(
      'pause_focus_timer',
    );

    expect(
      result.current.secondsRemaining,
    ).toBe(1200);

    expect(
      result.current.isRunning,
    ).toBe(false);
  });

  it('resets the native timer', async () => {
    mockedInvoke.mockResolvedValueOnce({
      seconds_remaining: 1500,
      is_running: false,
    });

    const { result } =
      renderHook(() => useFocusTimer());

    await act(async () => {
      await result.current.reset();
    });

    expect(mockedInvoke).toHaveBeenCalledWith(
      'reset_focus_timer',
    );

    expect(
      result.current.secondsRemaining,
    ).toBe(1500);

    expect(
      result.current.isRunning,
    ).toBe(false);

    expect(result.current.status).toBe(
      'idle',
    );
  });

  it('updates from timer_tick events', () => {
    const { result } =
      renderHook(() => useFocusTimer());

    const handler = listeners.get('timer_tick');

    expect(handler).toBeDefined();

    act(() => {
      handler?.({
        seconds_remaining: 1234,
        is_running: true,
      });
    });

    expect(
      result.current.secondsRemaining,
    ).toBe(1234);

    expect(
      result.current.isRunning,
    ).toBe(true);

    expect(result.current.status).toBe(
      'running',
    );
  });

  it('emits a focusTimer.started event when started', async () => {
    const handler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.FOCUS_TIMER_STARTED,
        handler,
      );

    mockedInvoke.mockResolvedValueOnce({
      seconds_remaining: 1499,
      is_running: true,
    });

    const { result } =
      renderHook(() => useFocusTimer());

    await act(async () => {
      await result.current.start();
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      seconds_remaining: 1499,
    });

    unsubscribe();
  });

  it('emits a focusTimer.paused event when a running timer is paused', async () => {
    const handler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.FOCUS_TIMER_PAUSED,
        handler,
      );

    mockedInvoke
      .mockResolvedValueOnce({
        seconds_remaining: 1490,
        is_running: true,
      })
      .mockResolvedValueOnce({
        seconds_remaining: 1485,
        is_running: false,
      });

    const { result } =
      renderHook(() => useFocusTimer());

    await act(async () => {
      await result.current.start();
      await result.current.pause();
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      seconds_remaining: 1485,
    });

    expect(result.current.status).toBe(
      'paused',
    );

    unsubscribe();
  });

  it('emits a focusTimer.completed event when timer reaches zero', () => {
    const handler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.FOCUS_TIMER_COMPLETED,
        handler,
      );

    const { result } =
      renderHook(() => useFocusTimer());

    const timerHandler =
      listeners.get('timer_tick');

    expect(timerHandler).toBeDefined();

    act(() => {
      timerHandler?.({
        seconds_remaining: 1499,
        is_running: true,
      });
    });

    act(() => {
      timerHandler?.({
        seconds_remaining: 0,
        is_running: false,
      });
    });

    expect(
      result.current.secondsRemaining,
    ).toBe(0);

    expect(result.current.status).toBe(
      'completed',
    );

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

    renderHook(() => useFocusTimer());

    const timerHandler =
      listeners.get('timer_tick');

    expect(timerHandler).toBeDefined();

    act(() => {
      timerHandler?.({
        seconds_remaining: 1499,
        is_running: true,
      });
    });

    act(() => {
      timerHandler?.({
        seconds_remaining: 0,
        is_running: false,
      });
    });

    act(() => {
      timerHandler?.({
        seconds_remaining: 0,
        is_running: false,
      });
    });

    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('emits a focusTimer.reset event when reset', async () => {
    const handler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.FOCUS_TIMER_RESET,
        handler,
      );

    mockedInvoke.mockResolvedValueOnce({
      seconds_remaining: 1500,
      is_running: false,
    });

    const { result } =
      renderHook(() => useFocusTimer());

    await act(async () => {
      await result.current.reset();
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      seconds_remaining: 1500,
    });

    expect(result.current.status).toBe(
      'idle',
    );

    unsubscribe();
  });

  it('does not emit a pause event when pausing an idle timer', async () => {
    const handler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.FOCUS_TIMER_PAUSED,
        handler,
      );

    mockedInvoke.mockResolvedValueOnce({
      seconds_remaining: 1500,
      is_running: false,
    });

    const { result } =
      renderHook(() => useFocusTimer());

    await act(async () => {
      await result.current.pause();
    });

    expect(handler).not.toHaveBeenCalled();

    expect(result.current.status).toBe(
      'idle',
    );

    unsubscribe();
  });
});