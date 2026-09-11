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

import type { MediaUpdate } from '../../lib/tauriEvents';

vi.mock('../../hooks/useMedia', () => ({
  useMedia: vi.fn(),
}));

vi.mock('../../hooks/useFocusTimer', () => ({
  useFocusTimer: vi.fn(),
}));

const mockedUseMedia =
  vi.mocked(useMedia);

const mockedUseFocusTimer =
  vi.mocked(useFocusTimer);

describe('ExpandedState', () => {
  const defaultTimerState: ReturnType<
    typeof useFocusTimer
  > = {
    secondsRemaining:
      25 * 60,
    isRunning: false,
    status: 'idle',
    start: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn(),
  };

  const defaultMedia: MediaUpdate = {
    app_id: 'spotify',
    title: 'Test Song',
    artist: 'Test Artist',
    is_playing: true,
    duration: 240,
    position: 120,
    artwork: null,
  };

  function renderMedia(
    overrides: Partial<MediaUpdate> = {},
  ) {
    mockedUseMedia.mockReturnValue({
      media: {
        ...defaultMedia,
        ...overrides,
      },
      hasMedia: true,
    });

    mockedUseFocusTimer.mockReturnValue(
      defaultTimerState,
    );

    render(
      <ExpandedState
        onCollapse={vi.fn()}
      />,
    );
  }

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows media progress and formatted time', () => {
    renderMedia();

    expect(
      screen.getByRole('progressbar', {
        name: 'Media progress',
      }),
    ).toHaveAttribute(
      'aria-valuenow',
      '50',
    );

    expect(
      screen.getByText('2:00'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('4:00'),
    ).toBeInTheDocument();
  });

  it('handles zero duration safely', () => {
    renderMedia({
      duration: 0,
      position: 0,
    });

    expect(
      screen.getByRole('progressbar', {
        name: 'Media progress',
      }),
    ).toHaveAttribute(
      'aria-valuenow',
      '0',
    );

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
      <ExpandedState
        onCollapse={vi.fn()}
      />,
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
      <ExpandedState
        onCollapse={vi.fn()}
      />,
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
      <ExpandedState
        onCollapse={vi.fn()}
      />,
    );

    expect(
      screen.getByText('00:00'),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        'Focus session complete',
      ),
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

  it('shows the artwork fallback when artwork is unavailable', () => {
    renderMedia({
      artwork: null,
    });

    expect(
      screen.getByText('♪'),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText('Playing'),
    ).toBeInTheDocument();
  });

  it('renders artwork when artwork is available', () => {
    renderMedia({
      artwork:
        'data:image/jpeg;base64,test-artwork',
    });

    const artwork =
      screen.getByRole('img');

    expect(artwork).toHaveAttribute(
      'src',
      'data:image/jpeg;base64,test-artwork',
    );
  });

  it('shows Unknown artist when artist metadata is empty', () => {
    renderMedia({
      artist: '',
    });

    expect(
      screen.getByText('Unknown artist'),
    ).toBeInTheDocument();
  });

  it('shows Unknown artist when artist metadata is whitespace', () => {
    renderMedia({
      artist: '   ',
    });

    expect(
      screen.getByText('   '),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Unknown artist'),
    ).not.toBeInTheDocument();
  });

  it('shows the media-unavailable state when media is unavailable', () => {
    mockedUseMedia.mockReturnValue({
      media: {
        ...defaultMedia,
        title: '',
        artist: '',
        artwork: null,
        is_playing: false,
      },
      hasMedia: false,
    });

    mockedUseFocusTimer.mockReturnValue(
      defaultTimerState,
    );

    render(
      <ExpandedState
        onCollapse={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        'No active media session',
      ),
    ).toBeInTheDocument();
  });

  it('shows the media title exactly as provided', () => {
    const longTitle =
      'Where Are U Now (with Justin Bieber) - Extended Deluxe Anniversary Remastered Version';

    renderMedia({
      title: longTitle,
    });

    expect(
      screen.getByText(longTitle),
    ).toBeInTheDocument();
  });

  it('shows the artist exactly as provided when present', () => {
    const longArtist =
      'Justin Bieber, Skrillex, Diplo, Major Lazer & Very Long Featuring Artist Name';

    renderMedia({
      artist: longArtist,
    });

    expect(
      screen.getByText(longArtist),
    ).toBeInTheDocument();
  });
});