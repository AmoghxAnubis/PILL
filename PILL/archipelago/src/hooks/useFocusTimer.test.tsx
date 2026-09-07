import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
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
    const { result } = renderHook(() => useFocusTimer());

    expect(result.current.secondsRemaining).toBe(25 * 60);
    expect(result.current.isRunning).toBe(false);
  });

  it('starts the native timer', async () => {
    mockedInvoke.mockResolvedValueOnce({
      seconds_remaining: 1499,
      is_running: true,
    });

    const { result } = renderHook(() => useFocusTimer());

    await act(async () => {
      await result.current.start();
    });

    expect(mockedInvoke).toHaveBeenCalledWith(
      'start_focus_timer',
    );

    expect(result.current.secondsRemaining).toBe(1499);
    expect(result.current.isRunning).toBe(true);
  });

  it('pauses the native timer', async () => {
    mockedInvoke.mockResolvedValueOnce({
      seconds_remaining: 1200,
      is_running: false,
    });

    const { result } = renderHook(() => useFocusTimer());

    await act(async () => {
      await result.current.pause();
    });

    expect(mockedInvoke).toHaveBeenCalledWith(
      'pause_focus_timer',
    );

    expect(result.current.secondsRemaining).toBe(1200);
    expect(result.current.isRunning).toBe(false);
  });

  it('resets the native timer', async () => {
    mockedInvoke.mockResolvedValueOnce({
      seconds_remaining: 1500,
      is_running: false,
    });

    const { result } = renderHook(() => useFocusTimer());

    await act(async () => {
      await result.current.reset();
    });

    expect(mockedInvoke).toHaveBeenCalledWith(
      'reset_focus_timer',
    );

    expect(result.current.secondsRemaining).toBe(1500);
    expect(result.current.isRunning).toBe(false);
  });

  it('updates from timer_tick events', () => {
    const { result } = renderHook(() => useFocusTimer());

    const handler = listeners.get('timer_tick');

    expect(handler).toBeDefined();

    act(() => {
      handler?.({
        seconds_remaining: 1234,
        is_running: true,
      });
    });

    expect(result.current.secondsRemaining).toBe(1234);
    expect(result.current.isRunning).toBe(true);
  });
});