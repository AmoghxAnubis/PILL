import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CompactState } from './CompactState';
import { useMedia } from '../../hooks/useMedia';

vi.mock('../../hooks/useMedia', () => ({
  useMedia: vi.fn(),
}));

vi.mock('../widgets/GlanceMetrics', () => ({
  GlanceMetrics: () => (
    <div data-testid="glance-metrics" />
  ),
}));

const mockedUseMedia = vi.mocked(useMedia);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CompactState', () => {
  it('shows the play icon when media is playing', () => {
    mockedUseMedia.mockReturnValue({
      hasMedia: true,
      media: {
        app_id: 'Spotify.exe',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: true,
        duration: 180,
        position: 30,
        artwork: null,
      },
    });

    render(<CompactState />);

    expect(screen.getByLabelText('Playing')).toHaveTextContent('▶');
    expect(screen.getByText('Test Song')).toBeInTheDocument();
  });

  it('shows the pause icon when media is paused', () => {
    mockedUseMedia.mockReturnValue({
      hasMedia: true,
      media: {
        app_id: 'Spotify.exe',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: false,
        duration: 180,
        position: 30,
        artwork: null,
      },
    });

    render(<CompactState />);

    expect(screen.getByLabelText('Paused')).toHaveTextContent('⏸');
    expect(screen.getByText('Test Song')).toBeInTheDocument();
  });

  it('shows Archipelago when no media is available', () => {
    mockedUseMedia.mockReturnValue({
      hasMedia: false,
      media: {
        app_id: '',
        title: '',
        artist: '',
        is_playing: false,
        duration: 0,
        position: 0,
        artwork: null,
      },
    });

    render(<CompactState />);

    expect(screen.getByText('Archipelago')).toBeInTheDocument();
  });
});