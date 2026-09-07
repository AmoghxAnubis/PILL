import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  DEFAULT_FOCUS_DURATION_SECS,
  useFocusTimerStore,
} from './focusTimerStore';

beforeEach(() => {
  useFocusTimerStore.setState({
    secondsRemaining:
      DEFAULT_FOCUS_DURATION_SECS,
    isRunning: false,
    hasStarted: false,
  });
});

describe('focusTimerStore', () => {
  it('starts with a stopped 25 minute timer', () => {
    const state =
      useFocusTimerStore.getState();

    expect(
      state.secondsRemaining,
    ).toBe(DEFAULT_FOCUS_DURATION_SECS);

    expect(state.isRunning).toBe(false);
    expect(state.hasStarted).toBe(false);
  });

  it('stores timer state', () => {
    useFocusTimerStore
      .getState()
      .setTimer(1200, true, true);

    const state =
      useFocusTimerStore.getState();

    expect(state.secondsRemaining).toBe(1200);
    expect(state.isRunning).toBe(true);
    expect(state.hasStarted).toBe(true);
  });

  it('resets timer state', () => {
    useFocusTimerStore
      .getState()
      .setTimer(1200, true, true);

    useFocusTimerStore
      .getState()
      .resetTimer({
        seconds_remaining:
          DEFAULT_FOCUS_DURATION_SECS,
        is_running: false,
      });

    const state =
      useFocusTimerStore.getState();

    expect(
      state.secondsRemaining,
    ).toBe(DEFAULT_FOCUS_DURATION_SECS);

    expect(state.isRunning).toBe(false);
    expect(state.hasStarted).toBe(false);
  });
});