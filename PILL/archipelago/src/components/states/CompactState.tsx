import type { WidgetOrchestration } from '../../lib/widgetOrchestrator';
import { useMedia } from '../../hooks/useMedia';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { GlanceMetrics } from '../widgets/GlanceMetrics';
import { FocusTimer } from '../widgets/FocusTimer';
import { GlanceClock } from '../widgets/GlanceClock';
import { MediaGlance } from '../widgets/MediaGlance';

const EMPTY_ORCHESTRATION: WidgetOrchestration = { layout: 'none', primary: null, secondary: null };

export function CompactState({ widgetOrchestration = EMPTY_ORCHESTRATION }: {
  widgetOrchestration?: WidgetOrchestration;
}) {
  const { media, hasMedia } = useMedia();
  const { status } = useFocusTimer();
  const primary = widgetOrchestration.layout !== 'none' ? widgetOrchestration.primary
    : hasMedia ? 'media' : status !== 'idle' ? 'focusTimer' : null;
  const showMedia = primary === 'media' && hasMedia;
  const showFocus = primary === 'focusTimer' && status !== 'idle';
  const showTelemetry = primary === 'telemetry';

  return (
    <div className="state-compact compact-glance" data-widget={primary ?? 'none'}>
      {showMedia ? <MediaGlance media={media} /> : (
        <div className="compact-glance__activity">
          <span className="compact-glance__symbol" aria-hidden="true">{showFocus ? '◷' : showTelemetry ? '▥' : 'P'}</span>
          <div className="compact-glance__copy">
            {showFocus ? <>
              <span className="compact-glance__label">{status === 'completed' ? 'Session complete' : status === 'paused' ? 'Focus paused' : 'Focus session'}</span>
              <div className="state-compact__focus" onClick={(event) => {
                if (event.target instanceof Element && event.target.closest('button')) event.stopPropagation();
              }}><FocusTimer /></div>
            </> : showTelemetry ? <>
              <span className="compact-glance__label">System</span>
              <GlanceMetrics />
            </> : <>
              <span className="compact-glance__title">PILL</span>
              <span className="compact-glance__subtitle">Your day, at a glance</span>
            </>}
          </div>
        </div>
      )}
      <GlanceClock />
    </div>
  );
}
