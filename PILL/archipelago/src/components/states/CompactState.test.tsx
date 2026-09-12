import {
  cleanup,
  render,
  screen,
} from '@testing-library/react';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { CompactState } from './CompactState';

import { useMedia } from '../../hooks/useMedia';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import type { WidgetOrchestration } from '../../lib/widgetOrchestrator';

vi.mock('../../hooks/useMedia', () => ({
  useMedia: vi.fn(),
}));

vi.mock('../../hooks/useFocusTimer', () => ({
  useFocusTimer: vi.fn(),
}));

vi.mock('../widgets/GlanceMetrics', () => ({
  GlanceMetrics: () => (
    <div data-testid="glance-metrics">
      Telemetry
    </div>
  ),
}));

vi.mock('../widgets/FocusTimer', () => ({
  FocusTimer: () => (
    <div data-testid="focus-timer">
      Focus timer
    </div>
  ),
}));

const mockedUseMedia =
  vi.mocked(useMedia);

const mockedUseFocusTimer =
  vi.mocked(useFocusTimer);

describe('CompactState', () => {
  const defaultMedia = {
    app_id: 'spotify',
    title: 'Test Song',
    artist: 'Test Artist',
    is_playing: true,
    duration: 240,
    position: 30,
    artwork: null,
  };

  const defaultTimerState = {
    secondsRemaining: 1500,
    isRunning: false,
    status: 'idle' as const,
    start: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn(),
  };

  beforeEach(() => {
    mockedUseMedia.mockReturnValue({
      media: defaultMedia,
      hasMedia: true,
    });

    mockedUseFocusTimer.mockReturnValue(
      defaultTimerState,
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  function renderCompactState(
    widgetOrchestration?: WidgetOrchestration,
  ) {
    return render(
      <CompactState
        widgetOrchestration={
          widgetOrchestration
        }
      />,
    );
  }

  it('shows the play icon when media is playing', () => {
    renderCompactState({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });

    expect(
      screen.getByLabelText('Playing'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Test Song'),
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId(
        'glance-metrics',
      ),
    ).not.toBeInTheDocument();
  });

  it('shows the pause icon when media is paused', () => {
    mockedUseMedia.mockReturnValue({
      media: {
        ...defaultMedia,
        is_playing: false,
      },
      hasMedia: true,
    });

    renderCompactState({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });

    expect(
      screen.getByLabelText('Paused'),
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId(
        'glance-metrics',
      ),
    ).not.toBeInTheDocument();
  });

  it('shows Archipelago when no media is available', () => {
    mockedUseMedia.mockReturnValue({
      media: {
        ...defaultMedia,
        title: '',
        artist: '',
      },
      hasMedia: false,
    });

    renderCompactState({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });

    expect(
      screen.getByText(
        'Archipelago',
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId(
        'glance-metrics',
      ),
    ).not.toBeInTheDocument();
  });

  it('shows telemetry only when telemetry is orchestrated', () => {
    renderCompactState({
      layout: 'single',
      primary: 'telemetry',
      secondary: null,
    });

    expect(
      screen.getByTestId(
        'glance-metrics',
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Test Song'),
    ).not.toBeInTheDocument();
  });

  it('shows the focus timer when running', () => {
    mockedUseFocusTimer.mockReturnValue({
      ...defaultTimerState,
      secondsRemaining: 1490,
      isRunning: true,
      status: 'running',
    });

    renderCompactState({
      layout: 'single',
      primary: 'focusTimer',
      secondary: null,
    });

    expect(
      screen.getByTestId(
        'focus-timer',
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId(
        'glance-metrics',
      ),
    ).not.toBeInTheDocument();
  });

  it('shows the focus timer when paused at 25 minutes', () => {
    mockedUseFocusTimer.mockReturnValue({
      ...defaultTimerState,
      secondsRemaining: 1500,
      isRunning: false,
      status: 'paused',
    });

    renderCompactState({
      layout: 'single',
      primary: 'focusTimer',
      secondary: null,
    });

    expect(
      screen.getByTestId(
        'focus-timer',
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId(
        'glance-metrics',
      ),
    ).not.toBeInTheDocument();
  });

  it('shows the focus timer when completed', () => {
    mockedUseFocusTimer.mockReturnValue({
      ...defaultTimerState,
      secondsRemaining: 0,
      isRunning: false,
      status: 'completed',
    });

    renderCompactState({
      layout: 'single',
      primary: 'focusTimer',
      secondary: null,
    });

    expect(
      screen.getByTestId(
        'focus-timer',
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId(
        'glance-metrics',
      ),
    ).not.toBeInTheDocument();
  });
});