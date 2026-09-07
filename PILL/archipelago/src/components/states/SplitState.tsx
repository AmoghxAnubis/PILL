import type { WidgetOrchestration } from '../../lib/widgetOrchestrator';

import { useMedia } from '../../hooks/useMedia';

import { GlanceMetrics } from '../widgets/GlanceMetrics';
import { FocusTimer } from '../widgets/FocusTimer';

interface SplitStateProps {
  widgetOrchestration?: WidgetOrchestration;
}

function MediaWidget() {
  const { media, hasMedia } = useMedia();

  if (!hasMedia) {
    return (
      <div
        className="state-split__widget state-split__widget--media"
        aria-label="Media unavailable"
      >
        <span className="state-split__widget-icon">
          ♪
        </span>
        <span className="state-split__widget-label">
          Media
        </span>
      </div>
    );
  }

  return (
    <div
      className="state-split__widget state-split__widget--media"
      title={`${media.title} — ${media.artist}`}
    >
      <span
        className="state-split__widget-icon"
        aria-label={
          media.is_playing
            ? 'Playing'
            : 'Paused'
        }
      >
        {media.is_playing ? '▶' : '⏸'}
      </span>

      <span className="state-split__widget-label">
        {media.title}
      </span>
    </div>
  );
}

function WidgetContent({
  widgetId,
}: {
  widgetId: string | null;
}) {
  switch (widgetId) {
    case 'focusTimer':
      return <FocusTimer />;

    case 'media':
      return <MediaWidget />;

    case 'telemetry':
      return <GlanceMetrics />;

    default:
      return (
        <span className="state-split__widget-label">
          {widgetId ?? 'None'}
        </span>
      );
  }
}

export function SplitState({
  widgetOrchestration,
}: SplitStateProps) {
  const orchestration =
    widgetOrchestration ?? {
      layout: 'none' as const,
      primary: null,
      secondary: null,
    };

  return (
    <div
      className="state-split"
      data-layout={orchestration.layout}
      data-primary={orchestration.primary ?? 'none'}
      data-secondary={
        orchestration.secondary ?? 'none'
      }
    >
      <div className="state-split__primary">
        <WidgetContent
          widgetId={orchestration.primary}
        />
      </div>

      <div
        className="state-split__badge"
        aria-label={
          orchestration.secondary
            ? `Secondary widget`
            : 'No secondary widget'
        }
      >
        <WidgetContent
          widgetId={orchestration.secondary}
        />
      </div>
    </div>
  );
}