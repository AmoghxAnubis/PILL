import type { MouseEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useMedia } from '../../hooks/useMedia';

interface ExpandedStateProps {
  onCollapse: () => void;
}

function formatMediaTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getProgressPercentage(position: number, duration: number): number {
  if (!Number.isFinite(position) || !Number.isFinite(duration)) {
    return 0;
  }

  if (duration <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (position / duration) * 100));
}

/**
 * ExpandedState — The full dashboard view of the island.
 * Shows active media information, progress, and playback controls.
 */
export function ExpandedState({ onCollapse }: ExpandedStateProps) {
  const { media, hasMedia } = useMedia();

  const progress = getProgressPercentage(
    media.position,
    media.duration,
  );

  const handlePrevious = async (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    try {
      await invoke('media_skip_previous');
    } catch (error) {
      console.error(
        '[Media] Failed to skip to previous track:',
        error,
      );
    }
  };

  const handlePlayPause = async (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    try {
      await invoke('media_toggle_play_pause');
    } catch (error) {
      console.error(
        '[Media] Failed to toggle play/pause:',
        error,
      );
    }
  };

  const handleNext = async (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    try {
      await invoke('media_skip_next');
    } catch (error) {
      console.error(
        '[Media] Failed to skip to next track:',
        error,
      );
    }
  };

  return (
    <div className="state-expanded">
      <div className="state-expanded__header">
        <span className="state-expanded__title">
          {hasMedia ? 'Now Playing' : 'Archipelago'}
        </span>

        <button
          className="state-expanded__close"
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            onCollapse();
          }}
          aria-label="Collapse island"
          type="button"
        >
          ✕
        </button>
      </div>

      {hasMedia ? (
        <div className="state-expanded__media">
          <div className="state-expanded__media-info">
            <span
              className="state-expanded__media-status"
              aria-label={media.is_playing ? 'Playing' : 'Paused'}
            >
              {media.is_playing ? '▶' : '⏸'}
            </span>

            <div className="state-expanded__media-text">
              <span className="state-expanded__media-title">
                {media.title}
              </span>

              <span className="state-expanded__media-artist">
                {media.artist || 'Unknown artist'}
              </span>
            </div>
          </div>

          <div className="state-expanded__progress">
            <div
              className="state-expanded__progress-track"
              role="progressbar"
              aria-label="Media progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div
                className="state-expanded__progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="state-expanded__progress-times">
              <span>{formatMediaTime(media.position)}</span>
              <span>{formatMediaTime(media.duration)}</span>
            </div>
          </div>

          <div className="state-expanded__controls">
            <button
              className="state-expanded__control"
              onClick={handlePrevious}
              aria-label="Previous track"
              type="button"
            >
              ⏮
            </button>

            <button
              className="state-expanded__control state-expanded__control--primary"
              onClick={handlePlayPause}
              aria-label={media.is_playing ? 'Pause' : 'Play'}
              type="button"
            >
              {media.is_playing ? '⏸' : '▶'}
            </button>

            <button
              className="state-expanded__control"
              onClick={handleNext}
              aria-label="Next track"
              type="button"
            >
              ⏭
            </button>
          </div>
        </div>
      ) : (
        <div className="state-expanded__body">
          <p className="state-expanded__placeholder">
            No active media session
          </p>
        </div>
      )}
    </div>
  );
}