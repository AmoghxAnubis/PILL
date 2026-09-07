/**
 * SplitState — Used when multiple concurrent widgets are active.
 *
 * The orchestrator supplies the primary and secondary widget IDs.
 * The actual widget presentation will be expanded in the next
 * orchestration step.
 */

import type { WidgetOrchestration } from '../../lib/widgetOrchestrator';

interface SplitStateProps {
  widgetOrchestration?: WidgetOrchestration;
}

const WIDGET_LABELS: Record<string, string> = {
  media: 'Media',
  focusTimer: 'Focus',
  telemetry: 'Telemetry',
};

function getWidgetLabel(
  widgetId: string | null,
): string {
  if (!widgetId) {
    return 'None';
  }

  return WIDGET_LABELS[widgetId] ?? widgetId;
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
    >
      <div className="state-split__primary">
        <span>
          {getWidgetLabel(
            orchestration.primary,
          )}
        </span>
      </div>

      <div
        className="state-split__badge"
        aria-label={
          orchestration.secondary
            ? `Secondary widget: ${getWidgetLabel(
                orchestration.secondary,
              )}`
            : 'No secondary widget'
        }
      >
        <span>
          {orchestration.secondary
            ? getWidgetLabel(
                orchestration.secondary,
              )
            : '•'}
        </span>
      </div>
    </div>
  );
}