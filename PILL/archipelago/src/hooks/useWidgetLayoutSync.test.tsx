import {
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
  DEFAULT_PILL_SETTINGS,
} from '../../../shared/settings/PillSettings';

import {
  useWidgetLayoutSync,
} from './useWidgetLayoutSync';

import {
  useWidgetOrchestrator,
} from './useWidgetOrchestrator';

import {
  useIslandState,
} from './useIslandState';

import {
  useIslandStore,
} from '../store/islandStore';

import {
  useSettingsStore,
} from '../store/settingsStore';

vi.mock('./useWidgetOrchestrator', () => ({
  useWidgetOrchestrator: vi.fn(),
}));

vi.mock('./useIslandState', () => ({
  useIslandState: vi.fn(),
}));

describe('useWidgetLayoutSync', () => {
  const transitionTo = vi.fn();
  const scheduleCollapse = vi.fn();

  beforeEach(() => {
    useIslandStore.setState({
      state: 'idle',
    });

    useSettingsStore.setState({
      settings: DEFAULT_PILL_SETTINGS,
    });

    transitionTo.mockReset();
    scheduleCollapse.mockReset();

    vi.clearAllMocks();

    vi.mocked(
      useIslandState,
    ).mockReturnValue({
      state: 'idle',
      transitionTo,
      scheduleCollapse,
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      handleClick: vi.fn(),
      handleCollapse: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('does not transition for no active layout while already idle', () => {
    vi.mocked(
      useWidgetOrchestrator,
    ).mockReturnValue({
      layout: 'none',
      primary: null,
      secondary: null,
    });

    renderHook(() =>
      useWidgetLayoutSync(),
    );

    expect(
      transitionTo,
    ).not.toHaveBeenCalled();

    expect(
      scheduleCollapse,
    ).not.toHaveBeenCalled();
  });

  it('transitions from idle to compact when a single widget becomes active', () => {
    vi.mocked(
      useWidgetOrchestrator,
    ).mockReturnValue({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });

    renderHook(() =>
      useWidgetLayoutSync(),
    );

    expect(
      transitionTo,
    ).toHaveBeenCalledWith(
      'compact',
    );

    expect(
      scheduleCollapse,
    ).not.toHaveBeenCalled();
  });

  it('does not transition for a single widget when already compact', () => {
    useIslandStore.setState({
      state: 'compact',
    });

    vi.mocked(
      useIslandState,
    ).mockReturnValue({
      state: 'compact',
      transitionTo,
      scheduleCollapse,
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      handleClick: vi.fn(),
      handleCollapse: vi.fn(),
    });

    vi.mocked(
      useWidgetOrchestrator,
    ).mockReturnValue({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });

    renderHook(() =>
      useWidgetLayoutSync(),
    );

    expect(
      transitionTo,
    ).not.toHaveBeenCalled();

    expect(
      scheduleCollapse,
    ).not.toHaveBeenCalled();
  });

  it('transitions into split mode when multiple widgets are active', () => {
    useIslandStore.setState({
      state: 'compact',
    });

    vi.mocked(
      useIslandState,
    ).mockReturnValue({
      state: 'compact',
      transitionTo,
      scheduleCollapse,
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      handleClick: vi.fn(),
      handleCollapse: vi.fn(),
    });

    vi.mocked(
      useWidgetOrchestrator,
    ).mockReturnValue({
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'media',
    });

    renderHook(() =>
      useWidgetLayoutSync(),
    );

    expect(
      transitionTo,
    ).toHaveBeenCalledWith(
      'split',
    );

    expect(
      scheduleCollapse,
    ).not.toHaveBeenCalled();
  });

  it('transitions from idle to split when multiple widgets become active', () => {
    vi.mocked(
      useWidgetOrchestrator,
    ).mockReturnValue({
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'media',
    });

    renderHook(() =>
      useWidgetLayoutSync(),
    );

    expect(
      transitionTo,
    ).toHaveBeenCalledWith(
      'split',
    );
  });

  it('does not transition when expanded and multiple widgets remain active', () => {
    useIslandStore.setState({
      state: 'expanded',
    });

    vi.mocked(
      useIslandState,
    ).mockReturnValue({
      state: 'expanded',
      transitionTo,
      scheduleCollapse,
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      handleClick: vi.fn(),
      handleCollapse: vi.fn(),
    });

    vi.mocked(
      useWidgetOrchestrator,
    ).mockReturnValue({
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'media',
    });

    renderHook(() =>
      useWidgetLayoutSync(),
    );

    expect(
      transitionTo,
    ).not.toHaveBeenCalled();

    expect(
      scheduleCollapse,
    ).not.toHaveBeenCalled();
  });

  it('restores compact mode when split is no longer required and one widget remains', () => {
    useIslandStore.setState({
      state: 'split',
    });

    vi.mocked(
      useIslandState,
    ).mockReturnValue({
      state: 'split',
      transitionTo,
      scheduleCollapse,
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      handleClick: vi.fn(),
      handleCollapse: vi.fn(),
    });

    vi.mocked(
      useWidgetOrchestrator,
    ).mockReturnValue({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });

    renderHook(() =>
      useWidgetLayoutSync(),
    );

    expect(
      transitionTo,
    ).toHaveBeenCalledWith(
      'compact',
    );

    expect(
      scheduleCollapse,
    ).not.toHaveBeenCalled();
  });

  it('transitions from split to idle when no widgets remain', () => {
    useIslandStore.setState({
      state: 'split',
    });

    vi.mocked(
      useIslandState,
    ).mockReturnValue({
      state: 'split',
      transitionTo,
      scheduleCollapse,
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      handleClick: vi.fn(),
      handleCollapse: vi.fn(),
    });

    vi.mocked(
      useWidgetOrchestrator,
    ).mockReturnValue({
      layout: 'none',
      primary: null,
      secondary: null,
    });

    renderHook(() =>
      useWidgetLayoutSync(),
    );

    expect(
      transitionTo,
    ).toHaveBeenCalledWith(
      'idle',
    );

    expect(
      scheduleCollapse,
    ).not.toHaveBeenCalled();
  });

  it('uses the default collapse delay when auto-collapse is enabled', () => {
    useIslandStore.setState({
      state: 'compact',
    });

    vi.mocked(
      useIslandState,
    ).mockReturnValue({
      state: 'compact',
      transitionTo,
      scheduleCollapse,
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      handleClick: vi.fn(),
      handleCollapse: vi.fn(),
    });

    vi.mocked(
      useWidgetOrchestrator,
    ).mockReturnValue({
      layout: 'none',
      primary: null,
      secondary: null,
    });

    renderHook(() =>
      useWidgetLayoutSync(),
    );

    expect(
      transitionTo,
    ).not.toHaveBeenCalled();

    expect(
      scheduleCollapse,
    ).toHaveBeenCalledWith(
      750,
    );
  });

  it('uses the configured collapse delay', () => {
    useIslandStore.setState({
      state: 'compact',
    });

    useSettingsStore.setState({
      settings: {
        ...DEFAULT_PILL_SETTINGS,
        behavior: {
          ...DEFAULT_PILL_SETTINGS.behavior,
          collapseDelayMs: 1500,
        },
      },
    });

    vi.mocked(
      useIslandState,
    ).mockReturnValue({
      state: 'compact',
      transitionTo,
      scheduleCollapse,
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      handleClick: vi.fn(),
      handleCollapse: vi.fn(),
    });

    vi.mocked(
      useWidgetOrchestrator,
    ).mockReturnValue({
      layout: 'none',
      primary: null,
      secondary: null,
    });

    renderHook(() =>
      useWidgetLayoutSync(),
    );

    expect(
      scheduleCollapse,
    ).toHaveBeenCalledWith(
      1500,
    );
  });

  it('does not schedule auto-collapse when it is disabled', () => {
    useIslandStore.setState({
      state: 'compact',
    });

    useSettingsStore.setState({
      settings: {
        ...DEFAULT_PILL_SETTINGS,
        behavior: {
          ...DEFAULT_PILL_SETTINGS.behavior,
          autoCollapse: false,
        },
      },
    });

    vi.mocked(
      useIslandState,
    ).mockReturnValue({
      state: 'compact',
      transitionTo,
      scheduleCollapse,
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      handleClick: vi.fn(),
      handleCollapse: vi.fn(),
    });

    vi.mocked(
      useWidgetOrchestrator,
    ).mockReturnValue({
      layout: 'none',
      primary: null,
      secondary: null,
    });

    renderHook(() =>
      useWidgetLayoutSync(),
    );

    expect(
      transitionTo,
    ).toHaveBeenCalledWith(
      'compact',
    );

    expect(
      scheduleCollapse,
    ).not.toHaveBeenCalled();
  });

  it('does not schedule a collapse when the island is expanded and no widgets remain', () => {
    useIslandStore.setState({
      state: 'expanded',
    });

    vi.mocked(
      useIslandState,
    ).mockReturnValue({
      state: 'expanded',
      transitionTo,
      scheduleCollapse,
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      handleClick: vi.fn(),
      handleCollapse: vi.fn(),
    });

    vi.mocked(
      useWidgetOrchestrator,
    ).mockReturnValue({
      layout: 'none',
      primary: null,
      secondary: null,
    });

    renderHook(() =>
      useWidgetLayoutSync(),
    );

    expect(
      transitionTo,
    ).not.toHaveBeenCalled();

    expect(
      scheduleCollapse,
    ).not.toHaveBeenCalled();
  });

  it('returns from idle to compact for any active single layout', () => {
    vi.mocked(
      useWidgetOrchestrator,
    ).mockReturnValue({
      layout: 'single',
      primary: 'telemetry',
      secondary: null,
    });

    renderHook(() =>
      useWidgetLayoutSync(),
    );

    expect(
      transitionTo,
    ).toHaveBeenCalledWith(
      'compact',
    );
  });

  it('does not schedule collapse while a widget remains active', () => {
    useIslandStore.setState({
      state: 'compact',
    });

    vi.mocked(
      useIslandState,
    ).mockReturnValue({
      state: 'compact',
      transitionTo,
      scheduleCollapse,
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      handleClick: vi.fn(),
      handleCollapse: vi.fn(),
    });

    vi.mocked(
      useWidgetOrchestrator,
    ).mockReturnValue({
      layout: 'single',
      primary: 'focusTimer',
      secondary: null,
    });

    renderHook(() =>
      useWidgetLayoutSync(),
    );

    expect(
      scheduleCollapse,
    ).not.toHaveBeenCalled();
  });
});