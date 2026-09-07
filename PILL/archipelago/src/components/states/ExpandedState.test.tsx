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

import { ExpandedState } from './ExpandedState';
import { useMedia } from '../../hooks/useMedia';
import { useFocusTimer } from '../../hooks/useFocusTimer';


vi.mock('../../hooks/useMedia', () => ({
  useMedia: vi.fn(),
}));

vi.mock('../../hooks/useFocusTimer', () => ({
  useFocusTimer: vi.fn(),
}));



const mockedUseMedia = vi.mocked(useMedia);
const mockedUseFocusTimer = vi.mocked(useFocusTimer);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ExpandedState', () => {
  const defaultTimerState: ReturnType<typeof useFocusTimer> = {
    secondsRemaining: 25 * 60,
    isRunning: false,
    status: 'idle',
    start: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn(),
  };

  const defaultMedia = {
    app_id: 'spotify',
    title: 'Test Song',
    artist: 'Test Artist',
    is_playing: true,
    duration: 240,
    position: 120,
    artwork: null,
  };

  it('shows media progress and formatted time', () => {
    mockedUseMedia.mockReturnValue({
      media: defaultMedia,
      hasMedia: true,
    });

    mockedUseFocusTimer.mockReturnValue(
      defaultTimerState,
    );

    render(
      <ExpandedState onCollapse={vi.fn()} />,
    );

    expect(
      screen.getByRole('progressbar', {
        name: 'Media progress',
      }),
    ).toHaveAttribute('aria-valuenow', '50');

    expect(screen.getByText('2:00')).toBeInTheDocument();
    expect(screen.getByText('4:00')).toBeInTheDocument();
  });

  it('handles zero duration safely', () => {
    mockedUseMedia.mockReturnValue({
      media: {
        ...defaultMedia,
        duration: 0,
        position: 0,
      },
      hasMedia: true,
    });

    mockedUseFocusTimer.mockReturnValue(
      defaultTimerState,
    );

    render(
      <ExpandedState onCollapse={vi.fn()} />,
    );

    expect(
      screen.getByRole('progressbar', {
        name: 'Media progress',
      }),
    ).toHaveAttribute('aria-valuenow', '0');

    expect(
      screen.getAllByText('0:00'),
    ).toHaveLength(2);
  });

  it('shows the focus timer when the timer is running', () => {
    mockedUseMedia.mockReturnValue({
      media: defaultMedia,
      hasMedia: true,
    });

    mockedUseFocusTimer.mockReturnValue({
      ...defaultTimerState,
      secondsRemaining: 1490,
      isRunning: true,
      status: 'running',
    });

    render(
      <ExpandedState onCollapse={vi.fn()} />,
    );

    expect(
      screen.getByText('24:50'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Focus session'),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Pause focus timer',
      }),
    ).toBeInTheDocument();
  });

  it('shows the focus timer when paused', () => {
    mockedUseMedia.mockReturnValue({
      media: defaultMedia,
      hasMedia: true,
    });

    mockedUseFocusTimer.mockReturnValue({
      ...defaultTimerState,
      secondsRemaining: 1200,
      isRunning: false,
      status: 'paused',
    });

    render(
      <ExpandedState onCollapse={vi.fn()} />,
    );

    expect(
      screen.getByText('20:00'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Focus paused'),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Resume focus timer',
      }),
    ).toBeInTheDocument();
  });

  it('shows completion state when the timer finishes', () => {
    mockedUseMedia.mockReturnValue({
      media: defaultMedia,
      hasMedia: true,
    });

    mockedUseFocusTimer.mockReturnValue({
      ...defaultTimerState,
      secondsRemaining: 0,
      isRunning: false,
      status: 'completed',
    });

    render(
      <ExpandedState onCollapse={vi.fn()} />,
    );

    expect(
      screen.getByText('00:00'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Focus session complete'),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', {
        name: 'Pause focus timer',
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Reset focus timer',
      }),
    ).toBeInTheDocument();
  });
});