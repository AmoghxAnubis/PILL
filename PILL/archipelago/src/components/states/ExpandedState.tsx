import type { MouseEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useMedia } from '../../hooks/useMedia';
import { useFocusTimer } from '../../hooks/useFocusTimer';

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

function formatFocusTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
}

function getProgressPercentage(
  position: number,
  duration: number,
): number {
  if (!Number.isFinite(position) || !Number.isFinite(duration)) {
    return 0;
  }

  if (duration <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, (position / duration) * 100),
  );
}

/**
 * ExpandedState — The full dashboard view of the island.
 *
 * Focus timer becomes the primary expanded view whenever it
 * is active. Otherwise the existing media dashboard is shown.
 */
export function ExpandedState({
  onCollapse,
}: ExpandedStateProps) {
  const { media, hasMedia } = useMedia();
  const {
    secondsRemaining,
    isRunning,
    status: focusTimerStatus,
    start,
    pause,
    reset,
  } = useFocusTimer();

  const progress = getProgressPercentage(
    media.position,
    media.duration,
  );

  const showFocusTimer = focusTimerStatus !== 'idle';
  const focusTimerCompleted =
    focusTimerStatus === 'completed';

  const handleFocusToggle = (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    if (isRunning) {
      void pause();
    } else {
      void start();
    }
  };

  const handleFocusReset = (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    void reset();
  };

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
          {showFocusTimer
            ? 'Focus'
            : hasMedia
              ? 'Now Playing'
              : 'Archipelago'}
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

      {showFocusTimer ? (
        <div
          className={`state-expanded__focus-timer${
            focusTimerCompleted
              ? ' state-expanded__focus-timer--completed'
              : ''
          }`}
          data-status={focusTimerStatus}
        >
          <div className="state-expanded__focus-icon">
            {focusTimerCompleted ? '✓' : '◷'}
          </div>

          <div className="state-expanded__focus-content">
            <span className="state-expanded__focus-label">
              {focusTimerCompleted
                ? 'Focus session complete'
                : focusTimerStatus === 'paused'
                  ? 'Focus paused'
                  : 'Focus session'}
            </span>

            <span className="state-expanded__focus-time">
              {formatFocusTime(secondsRemaining)}
            </span>

            <div className="state-expanded__focus-progress">
              <div
                className="state-expanded__focus-progress-fill"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      ((25 * 60 - secondsRemaining) /
                        (25 * 60)) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="state-expanded__focus-controls">
            {!focusTimerCompleted && (
              <button
                className="state-expanded__control state-expanded__control--primary"
                onClick={handleFocusToggle}
                aria-label={
                  isRunning
                    ? 'Pause focus timer'
                    : 'Resume focus timer'
                }
                type="button"
              >
                {isRunning ? 'Ⅱ' : '▶'}
              </button>
            )}

            <button
              className="state-expanded__control"
              onClick={handleFocusReset}
              aria-label="Reset focus timer"
              type="button"
            >
              ↻
            </button>
          </div>
        </div>
      ) : hasMedia ? (
        <div className="state-expanded__media">
          <div className="state-expanded__media-info">
            {media.artwork ? (
              <img
                className="state-expanded__media-artwork"
                src={media.artwork}
                alt=""
              />
            ) : (
              <div
                className="state-expanded__media-artwork state-expanded__media-artwork--fallback"
                aria-hidden="true"
              >
                ♪
              </div>
            )}

            <span
              className="state-expanded__media-status"
              aria-label={
                media.is_playing ? 'Playing' : 'Paused'
              }
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
              <span>
                {formatMediaTime(media.position)}
              </span>

              <span>
                {formatMediaTime(media.duration)}
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
              aria-label={
                media.is_playing ? 'Pause' : 'Play'
              }
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