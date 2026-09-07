import { renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useWidgetLayoutSync } from './useWidgetLayoutSync';
import { useWidgetOrchestrator } from './useWidgetOrchestrator';
import { useIslandState } from './useIslandState';
import { useIslandStore } from '../store/islandStore';

vi.mock('./useWidgetOrchestrator', () => ({
  useWidgetOrchestrator: vi.fn(),
}));

vi.mock('./useIslandState', () => ({
  useIslandState: vi.fn(),
}));

describe('useWidgetLayoutSync', () => {
  const transitionTo = vi.fn();

  beforeEach(() => {
    useIslandStore.setState({
      state: 'idle',
    });

    transitionTo.mockReset();

    vi.mocked(useIslandState).mockReturnValue({
      state: 'idle',
      transitionTo,
      scheduleCollapse: vi.fn(),
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      handleClick: vi.fn(),
      handleCollapse: vi.fn(),
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not transition for no active layout', () => {
    vi.mocked(useWidgetOrchestrator).mockReturnValue({
      layout: 'none',
      primary: null,
      secondary: null,
    });

    renderHook(() => useWidgetLayoutSync());

    expect(transitionTo).not.toHaveBeenCalled();
  });

  it('does not transition for a single widget', () => {
    useIslandStore.setState({
      state: 'compact',
    });

    vi.mocked(useIslandState).mockReturnValue({
      state: 'compact',
      transitionTo,
      scheduleCollapse: vi.fn(),
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      handleClick: vi.fn(),
      handleCollapse: vi.fn(),
    });

    vi.mocked(useWidgetOrchestrator).mockReturnValue({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });

    renderHook(() => useWidgetLayoutSync());

    expect(transitionTo).not.toHaveBeenCalled();
  });

  it('transitions into split mode when multiple widgets are active', () => {
    useIslandStore.setState({
      state: 'compact',
    });

    vi.mocked(useIslandState).mockReturnValue({
      state: 'compact',
      transitionTo,
      scheduleCollapse: vi.fn(),
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      handleClick: vi.fn(),
      handleCollapse: vi.fn(),
    });

    vi.mocked(useWidgetOrchestrator).mockReturnValue({
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'media',
    });

    renderHook(() => useWidgetLayoutSync());

    expect(transitionTo).toHaveBeenCalledWith(
      'split',
    );
  });

  it('transitions from expanded to split when multiple widgets become active', () => {
    useIslandStore.setState({
      state: 'expanded',
    });

    vi.mocked(useIslandState).mockReturnValue({
      state: 'expanded',
      transitionTo,
      scheduleCollapse: vi.fn(),
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      handleClick: vi.fn(),
      handleCollapse: vi.fn(),
    });

    vi.mocked(useWidgetOrchestrator).mockReturnValue({
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'media',
    });

    renderHook(() => useWidgetLayoutSync());

    expect(transitionTo).toHaveBeenCalledWith(
      'split',
    );
  });

  it('restores compact mode when split is no longer required', () => {
    useIslandStore.setState({
      state: 'split',
    });

    vi.mocked(useIslandState).mockReturnValue({
      state: 'split',
      transitionTo,
      scheduleCollapse: vi.fn(),
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      handleClick: vi.fn(),
      handleCollapse: vi.fn(),
    });

    vi.mocked(useWidgetOrchestrator).mockReturnValue({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });

    renderHook(() => useWidgetLayoutSync());

    expect(transitionTo).toHaveBeenCalledWith(
      'compact',
    );
  });
});