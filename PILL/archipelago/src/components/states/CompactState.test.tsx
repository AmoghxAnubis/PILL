import {
  cleanup,
  render,
  screen,
} from '@testing-library/react';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { CompactState } from './CompactState';
import { useMedia } from '../../hooks/useMedia';
import { useFocusTimer } from '../../hooks/useFocusTimer';

vi.mock('../../hooks/useMedia', () => ({
  useMedia: vi.fn(),
}));

vi.mock('../../hooks/useFocusTimer', () => ({
  useFocusTimer: vi.fn(),
}));

vi.mock('../widgets/GlanceMetrics', () => ({
  GlanceMetrics: () => (
    <div data-testid="glance-metrics" />
  ),
}));

vi.mock('../widgets/FocusTimer', () => ({
  FocusTimer: () => (
    <div data-testid="focus-timer" />
  ),
}));

const mockedUseMedia = vi.mocked(useMedia);
const mockedUseFocusTimer = vi.mocked(useFocusTimer);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CompactState', () => {
  const defaultTimerState: ReturnType<typeof useFocusTimer> = {
    secondsRemaining: 25 * 60,
    isRunning: false,
    status: 'idle',
    start: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn(),
  };

  it('shows the play icon when media is playing', () => {
    mockedUseMedia.mockReturnValue({
      media: {
        app_id: 'spotify',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: true,
        duration: 240,
        position: 30,
        artwork: null,
      },
      hasMedia: true,
    });

    mockedUseFocusTimer.mockReturnValue(
      defaultTimerState,
    );

    render(<CompactState />);

    expect(
      screen.getByLabelText('Playing'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Test Song'),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId('glance-metrics'),
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId('focus-timer'),
    ).not.toBeInTheDocument();
  });

  it('shows the pause icon when media is paused', () => {
    mockedUseMedia.mockReturnValue({
      media: {
        app_id: 'spotify',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: false,
        duration: 240,
        position: 30,
        artwork: null,
      },
      hasMedia: true,
    });

    mockedUseFocusTimer.mockReturnValue(
      defaultTimerState,
    );

    render(<CompactState />);

    expect(
      screen.getByLabelText('Paused'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Test Song'),
    ).toBeInTheDocument();
  });

  it('shows Archipelago when no media is available', () => {
    mockedUseMedia.mockReturnValue({
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
    });

    mockedUseFocusTimer.mockReturnValue(
      defaultTimerState,
    );

    render(<CompactState />);

    expect(
      screen.getByText('Archipelago'),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId('glance-metrics'),
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId('focus-timer'),
    ).not.toBeInTheDocument();
  });

  it('shows the focus timer when running', () => {
    mockedUseMedia.mockReturnValue({
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
    });

    mockedUseFocusTimer.mockReturnValue({
      ...defaultTimerState,
      secondsRemaining: 1490,
      isRunning: true,
      status: 'running',
    });

    render(<CompactState />);

    expect(
      screen.getByTestId('focus-timer'),
    ).toBeInTheDocument();
  });

  it('shows the focus timer when paused at 25 minutes', () => {
    mockedUseMedia.mockReturnValue({
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
    });

    mockedUseFocusTimer.mockReturnValue({
      ...defaultTimerState,
      secondsRemaining: 1500,
      isRunning: false,
      status: 'paused',
    });

    render(<CompactState />);

    expect(
      screen.getByTestId('focus-timer'),
    ).toBeInTheDocument();
  });

  it('shows the focus timer when completed', () => {
    mockedUseMedia.mockReturnValue({
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
    });

    mockedUseFocusTimer.mockReturnValue({
      ...defaultTimerState,
      secondsRemaining: 0,
      isRunning: false,
      status: 'completed',
    });

    render(<CompactState />);

    expect(
      screen.getByTestId('focus-timer'),
    ).toBeInTheDocument();
  });
});