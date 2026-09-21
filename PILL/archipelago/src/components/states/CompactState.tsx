/**
 * CompactState — The glance state of the island.
 *
 * The widget orchestrator determines which widget is active.
 * CompactState renders the primary widget selected by the
 * orchestrator and keeps the presentation intentionally minimal.
 */

import type { WidgetOrchestration } from '../../lib/widgetOrchestrator';

import { useMedia } from '../../hooks/useMedia';
import { useFocusTimer } from '../../hooks/useFocusTimer';

import { GlanceMetrics } from '../widgets/GlanceMetrics';
import { FocusTimer } from '../widgets/FocusTimer';

interface CompactStateProps {
  widgetOrchestration?: WidgetOrchestration;
}

const EMPTY_ORCHESTRATION: WidgetOrchestration = {
  layout: 'none',
  primary: null,
  secondary: null,
};

export function CompactState({
  widgetOrchestration,
}: CompactStateProps) {
  const { media, hasMedia } = useMedia();
  const { status } = useFocusTimer();

  const orchestration =
    widgetOrchestration ??
    EMPTY_ORCHESTRATION;

  const hasOrchestratedWidgets =
    orchestration.layout !== 'none';

  /*
   * When orchestration is active, the primary widget
   * decides what the compact pill should present.
   *
   * This prevents telemetry, media, and focus content
   * from appearing simultaneously in an otherwise
   * single-widget presentation.
   */
  const primaryWidget =
    hasOrchestratedWidgets
      ? orchestration.primary
      : hasMedia
        ? 'media'
        : status !== 'idle'
          ? 'focusTimer'
          : null;

  const showMedia =
    primaryWidget === 'media' &&
    hasMedia;

  const showFocusTimer =
    primaryWidget === 'focusTimer' &&
    status !== 'idle';

  const showTelemetry =
    primaryWidget === 'telemetry';

  const compactClassName = [
    'state-compact',
    showMedia
      ? 'state-compact--media'
      : '',
    showFocusTimer
      ? 'state-compact--focus'
      : '',
    showTelemetry
      ? 'state-compact--telemetry'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={compactClassName}
      data-widget={primaryWidget ?? 'none'}
    >
      <div className="state-compact__indicator">
        <div className="state-compact__dot state-compact__dot--active" />
      </div>

      {showMedia && (
        <div
          className="state-compact__media"
          title={`${media.title} — ${media.artist}`}
        >
          <span
            className="state-compact__media-icon"
            aria-label={
              media.is_playing
                ? 'Playing'
                : 'Paused'
            }
          >
            {media.is_playing
              ? '▶'
              : '⏸'}
          </span>

          <span className="state-compact__media-title">
            {media.title}
          </span>
        </div>
      )}

      {showFocusTimer && (
        <div className="state-compact__focus">
          <FocusTimer />
        </div>
      )}

      {showTelemetry && (
        <GlanceMetrics />
      )}

      {!showMedia &&
        !showFocusTimer &&
        !showTelemetry && (
          <span className="state-compact__label">
            Archipelago
          </span>
        )}
    </div>
  );
}