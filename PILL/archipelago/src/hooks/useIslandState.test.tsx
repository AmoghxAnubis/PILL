import { act, renderHook } from '@testing-library/react';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useIslandState } from './useIslandState';
import { useIslandStore } from '../store/islandStore';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

import { invoke } from '@tauri-apps/api/core';

describe('useIslandState', () => {
  beforeEach(() => {
    useIslandStore.setState({
      state: 'idle',
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('transitions from idle to expanded on mouse enter', async () => {
    const { result } = renderHook(() => useIslandState());

    await act(async () => {
      result.current.handleMouseEnter();
    });

    expect(
      useIslandStore.getState().state,
    ).toBe('expanded');

    expect(invoke).toHaveBeenCalledWith(
      'resize_island',
      {
        width: 360,
        height: 140,
      },
    );

    expect(invoke).toHaveBeenCalledWith(
      'notify_state_change',
      {
        state: 'expanded',
      },
    );
  });

  it('transitions from compact to expanded on mouse enter', async () => {
    useIslandStore.setState({
      state: 'compact',
    });

    const { result } = renderHook(() => useIslandState());

    await act(async () => {
      result.current.handleMouseEnter();
    });

    expect(
      useIslandStore.getState().state,
    ).toBe('expanded');

    expect(invoke).toHaveBeenCalledWith(
      'resize_island',
      {
        width: 360,
        height: 140,
      },
    );

    expect(invoke).toHaveBeenCalledWith(
      'notify_state_change',
      {
        state: 'expanded',
      },
    );
  });

  it('transitions from compact to idle on mouse leave', async () => {
    useIslandStore.setState({
      state: 'compact',
    });

    const { result } = renderHook(() => useIslandState());

    await act(async () => {
      result.current.handleMouseLeave();
    });

    expect(
      useIslandStore.getState().state,
    ).toBe('idle');

    expect(invoke).toHaveBeenCalledWith(
      'resize_island',
      {
        width: 110,
        height: 32,
      },
    );

    expect(invoke).toHaveBeenCalledWith(
      'notify_state_change',
      {
        state: 'idle',
      },
    );
  });

  it('transitions from compact to expanded on click', async () => {
    useIslandStore.setState({
      state: 'compact',
    });

    const { result } = renderHook(() => useIslandState());

    await act(async () => {
      result.current.handleClick();
    });

    expect(
      useIslandStore.getState().state,
    ).toBe('expanded');

    expect(invoke).toHaveBeenCalledWith(
      'resize_island',
      {
        width: 360,
        height: 140,
      },
    );

    expect(invoke).toHaveBeenCalledWith(
      'notify_state_change',
      {
        state: 'expanded',
      },
    );
  });

  it('collapses expanded to idle', async () => {
    useIslandStore.setState({
      state: 'expanded',
    });

    const { result } = renderHook(() => useIslandState());

    await act(async () => {
      result.current.handleCollapse();
    });

    expect(
      useIslandStore.getState().state,
    ).toBe('idle');

    expect(invoke).toHaveBeenCalledWith(
      'resize_island',
      {
        width: 110,
        height: 32,
      },
    );

    expect(invoke).toHaveBeenCalledWith(
      'notify_state_change',
      {
        state: 'idle',
      },
    );
  });

  it('does not manually collapse split mode', async () => {
    useIslandStore.setState({
      state: 'split',
    });

    const { result } = renderHook(() => useIslandState());

    await act(async () => {
      result.current.handleCollapse();
    });

    expect(
      useIslandStore.getState().state,
    ).toBe('split');

    expect(invoke).not.toHaveBeenCalled();
  });

  it('transitions to split with the correct native dimensions', async () => {
    const { result } = renderHook(() => useIslandState());

    await act(async () => {
      await result.current.transitionTo('split');
    });

    expect(
      useIslandStore.getState().state,
    ).toBe('split');

    expect(invoke).toHaveBeenCalledWith(
      'resize_island',
      {
        width: 400,
        height: 50,
      },
    );

    expect(invoke).toHaveBeenCalledWith(
      'set_click_through',
      {
        enabled: false,
      },
    );

    expect(invoke).toHaveBeenCalledWith(
      'notify_state_change',
      {
        state: 'split',
      },
    );
  });

  it('does not transition when already in the requested state', async () => {
    useIslandStore.setState({
      state: 'split',
    });

    const { result } = renderHook(() => useIslandState());

    await act(async () => {
      await result.current.transitionTo('split');
    });

    expect(
      useIslandStore.getState().state,
    ).toBe('split');

    expect(invoke).not.toHaveBeenCalled();
  });

  it('uses the requested delay when scheduling collapse', async () => {
    vi.useFakeTimers();

    useIslandStore.setState({
      state: 'expanded',
    });

    const { result } = renderHook(() => useIslandState());

    act(() => {
      result.current.scheduleCollapse(1000);
    });

    expect(
      useIslandStore.getState().state,
    ).toBe('expanded');

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(
      useIslandStore.getState().state,
    ).toBe('idle');
  });

  it('cancels a previous collapse timer when a new transition occurs', async () => {
    vi.useFakeTimers();

    useIslandStore.setState({
      state: 'expanded',
    });

    const { result } = renderHook(() => useIslandState());

    act(() => {
      result.current.scheduleCollapse(1000);
    });

    await act(async () => {
      await result.current.transitionTo('compact');
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(
      useIslandStore.getState().state,
    ).toBe('compact');
  });
});