/**
 * CompactState — The glance state of the island.
 *
 * The widget orchestrator determines which widgets are active.
 * Only the widgets selected by the orchestrator are rendered.
 */

import type { WidgetOrchestration } from '../../lib/widgetOrchestrator';

import { useMedia } from '../../hooks/useMedia';
import { useFocusTimer } from '../../hooks/useFocusTimer';

import { GlanceMetrics } from '../widgets/GlanceMetrics';
import { FocusTimer } from '../widgets/FocusTimer';

interface CompactStateProps {
  widgetOrchestration?: WidgetOrchestration;
}

export function CompactState({
  widgetOrchestration,
}: CompactStateProps) {
  const { media, hasMedia } = useMedia();
  const { status } = useFocusTimer();

  const orchestration =
    widgetOrchestration ?? {
      layout: 'none' as const,
      primary: null,
      secondary: null,
    };

  const orchestratedWidgets = new Set([
    orchestration.primary,
    orchestration.secondary,
  ]);

  const hasOrchestratedWidgets =
    orchestration.layout !== 'none';

  const showFocusTimer =
    hasOrchestratedWidgets
      ? orchestratedWidgets.has('focusTimer') &&
        status !== 'idle'
      : status !== 'idle';

  const showMedia =
    hasOrchestratedWidgets
      ? orchestratedWidgets.has('media') &&
        hasMedia
      : hasMedia;

  const showTelemetry =
    hasOrchestratedWidgets
      ? orchestratedWidgets.has('telemetry')
      : false;

  return (
    <div
      className={`state-compact${
        showMedia
          ? ' state-compact--media'
          : ''
      }`}
    >
      <div className="state-compact__indicator">
        <div className="state-compact__dot state-compact__dot--active" />
      </div>

      {showMedia ? (
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
      ) : (
        <span className="state-compact__label">
          Archipelago
        </span>
      )}

      {showFocusTimer && (
        <FocusTimer />
      )}

      {showTelemetry && (
        <GlanceMetrics />
      )}
    </div>
  );
}