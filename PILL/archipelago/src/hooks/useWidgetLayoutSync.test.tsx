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
import { useIslandStore } from '../store/islandStore';

vi.mock('./useWidgetOrchestrator', () => ({
  useWidgetOrchestrator: vi.fn(),
}));

describe('useWidgetLayoutSync', () => {
  beforeEach(() => {
    useIslandStore.setState({
      state: 'idle',
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not change normal island state for no active layout', () => {
    vi.mocked(useWidgetOrchestrator).mockReturnValue({
      layout: 'none',
      primary: null,
      secondary: null,
    });

    renderHook(() => useWidgetLayoutSync());

    expect(
      useIslandStore.getState().state,
    ).toBe('idle');
  });

  it('does not change normal island state for a single widget', () => {
    useIslandStore.setState({
      state: 'compact',
    });

    vi.mocked(useWidgetOrchestrator).mockReturnValue({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });

    renderHook(() => useWidgetLayoutSync());

    expect(
      useIslandStore.getState().state,
    ).toBe('compact');
  });

  it('enters split mode when multiple widgets are active', async () => {
    useIslandStore.setState({
      state: 'compact',
    });

    vi.mocked(useWidgetOrchestrator).mockReturnValue({
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'media',
    });

    renderHook(() => useWidgetLayoutSync());

    await vi.waitFor(() => {
      expect(
        useIslandStore.getState().state,
      ).toBe('split');
    });
  });

  it('enters split mode from expanded state', async () => {
    useIslandStore.setState({
      state: 'expanded',
    });

    vi.mocked(useWidgetOrchestrator).mockReturnValue({
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'media',
    });

    renderHook(() => useWidgetLayoutSync());

    await vi.waitFor(() => {
      expect(
        useIslandStore.getState().state,
      ).toBe('split');
    });
  });

  it('restores compact mode when split is no longer required', async () => {
    useIslandStore.setState({
      state: 'split',
    });

    vi.mocked(useWidgetOrchestrator).mockReturnValue({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });

    renderHook(() => useWidgetLayoutSync());

    await vi.waitFor(() => {
      expect(
        useIslandStore.getState().state,
      ).toBe('compact');
    });
  });
});