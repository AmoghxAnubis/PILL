import type { MouseEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useMedia } from '../../hooks/useMedia';

interface ExpandedStateProps {
  onCollapse: () => void;
}

/**
 * ExpandedState — The full dashboard view of the island.
 * Shows active media information and playback controls.
 */
export function ExpandedState({ onCollapse }: ExpandedStateProps) {
  const { media, hasMedia } = useMedia();

  const handlePrevious = async (event: MouseEvent<HTMLButtonElement>) => {
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

  const handleNext = async (event: MouseEvent<HTMLButtonElement>) => {
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