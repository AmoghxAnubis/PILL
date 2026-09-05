import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExpandedState } from './ExpandedState';
import { useMedia } from '../../hooks/useMedia';

vi.mock('../../hooks/useMedia', () => ({
  useMedia: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockedUseMedia = vi.mocked(useMedia);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ExpandedState', () => {
  it('shows media progress and formatted time', () => {
    mockedUseMedia.mockReturnValue({
      hasMedia: true,
      media: {
        app_id: 'Spotify.exe',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: true,
        duration: 240,
        position: 125,
        artwork: null,
      },
    });

    render(<ExpandedState onCollapse={vi.fn()} />);

    expect(screen.getByText('2:05')).toBeInTheDocument();
    expect(screen.getByText('4:00')).toBeInTheDocument();

    const progressBar = screen.getByRole('progressbar');

    expect(progressBar).toHaveAttribute(
      'aria-valuenow',
      '52',
    );
  });

  it('handles zero duration safely', () => {
    mockedUseMedia.mockReturnValue({
      hasMedia: true,
      media: {
        app_id: 'Spotify.exe',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: true,
        duration: 0,
        position: 0,
        artwork: null,
      },
    });

    render(<ExpandedState onCollapse={vi.fn()} />);

    const progressBar = screen.getByRole('progressbar');

    expect(progressBar).toHaveAttribute(
      'aria-valuenow',
      '0',
    );

    const zeroTimeValues = screen.getAllByText('0:00');

    expect(zeroTimeValues).toHaveLength(2);
  });
});