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

import { useWidgetActivity } from './useWidgetActivity';
import { useMedia } from './useMedia';
import { useFocusTimer } from './useFocusTimer';
import { useWidgetStore } from '../store/widgetStore';

vi.mock('./useMedia', () => ({
  useMedia: vi.fn(),
}));

vi.mock('./useFocusTimer', () => ({
  useFocusTimer: vi.fn(),
}));

const mockedUseMedia = vi.mocked(useMedia);
const mockedUseFocusTimer =
  vi.mocked(useFocusTimer);

const defaultMedia = {
  media: {
    app_id: '',
    title: '',
    artist: '',
    is_playing: false,
    duration: 0,
    position: 0,
    artwork: null,
  },
  hasMedia: false,
};

const defaultTimer: ReturnType<typeof useFocusTimer> = {
  secondsRemaining: 1500,
  isRunning: false,
  status: 'idle',
  start: vi.fn(),
  pause: vi.fn(),
  reset: vi.fn(),
};

beforeEach(() => {
  useWidgetStore.getState().clearWidgets();

  mockedUseMedia.mockReturnValue(defaultMedia);
  mockedUseFocusTimer.mockReturnValue(defaultTimer);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('useWidgetActivity', () => {
  it('does not activate widgets when no features are active', () => {
    renderHook(() => useWidgetActivity());

    expect(
      useWidgetStore.getState().activeWidgets,
    ).toEqual([]);
  });

  it('activates media when media is available', () => {
    mockedUseMedia.mockReturnValue({
      ...defaultMedia,
      hasMedia: true,
    });

    renderHook(() => useWidgetActivity());

    expect(
      useWidgetStore.getState().activeWidgets,
    ).toEqual(['media']);
  });

  it('deactivates media when media disappears', () => {
    mockedUseMedia.mockReturnValue({
      ...defaultMedia,
      hasMedia: true,
    });

    const { rerender } = renderHook(
      () => useWidgetActivity(),
    );

    expect(
      useWidgetStore.getState().activeWidgets,
    ).toContain('media');

    mockedUseMedia.mockReturnValue(defaultMedia);

    act(() => {
      rerender();
    });

    expect(
      useWidgetStore.getState().activeWidgets,
    ).not.toContain('media');
  });

  it('activates the focus timer when active', () => {
    mockedUseFocusTimer.mockReturnValue({
      ...defaultTimer,
      secondsRemaining: 1490,
      isRunning: true,
      status: 'running',
    });

    renderHook(() => useWidgetActivity());

    expect(
      useWidgetStore.getState().activeWidgets,
    ).toEqual(['focusTimer']);
  });

  it('deactivates the focus timer when reset to idle', () => {
    mockedUseFocusTimer.mockReturnValue({
      ...defaultTimer,
      secondsRemaining: 1490,
      isRunning: true,
      status: 'running',
    });

    const { rerender } = renderHook(
      () => useWidgetActivity(),
    );

    expect(
      useWidgetStore.getState().activeWidgets,
    ).toContain('focusTimer');

    mockedUseFocusTimer.mockReturnValue(
      defaultTimer,
    );

    act(() => {
      rerender();
    });

    expect(
      useWidgetStore.getState().activeWidgets,
    ).not.toContain('focusTimer');
  });

  it('activates media and focus timer independently', () => {
    mockedUseMedia.mockReturnValue({
      ...defaultMedia,
      hasMedia: true,
    });

    mockedUseFocusTimer.mockReturnValue({
      ...defaultTimer,
      secondsRemaining: 1490,
      isRunning: true,
      status: 'running',
    });

    renderHook(() => useWidgetActivity());

    expect(
      useWidgetStore.getState().activeWidgets,
    ).toEqual([
      'media',
      'focusTimer',
    ]);
  });
});