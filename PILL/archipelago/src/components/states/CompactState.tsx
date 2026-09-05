/**
 * CompactState — The hover/glance state of the island.
 * Shows live telemetry and active media information.
 */

import { useMedia } from '../../hooks/useMedia';
import { GlanceMetrics } from '../widgets/GlanceMetrics';

export function CompactState() {
  const { media, hasMedia } = useMedia();

  return (
    <div
      className={`state-compact${
        hasMedia ? ' state-compact--media' : ''
      }`}
    >
      <div className="state-compact__indicator">
        <div className="state-compact__dot state-compact__dot--active" />
      </div>

      {hasMedia ? (
        <div
          className="state-compact__media"
          title={`${media.title} — ${media.artist}`}
        >
          <span
            className="state-compact__media-icon"
            aria-label={media.is_playing ? 'Playing' : 'Paused'}
          >
            {media.is_playing ? '▶' : '⏸'}
          </span>

          <span className="state-compact__media-title">
            {media.title}
          </span>
        </div>
      ) : (
        <span className="state-compact__label">Archipelago</span>
      )}

      <GlanceMetrics />
    </div>
  );
}