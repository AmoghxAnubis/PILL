import type { KeyboardEvent } from 'react';
import type { WidgetOrchestration } from '../../lib/widgetOrchestrator';
import { availableModules } from '../../lib/islandModules';
import { useIslandStore } from '../../store/islandStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTelemetryStore } from '../../store/telemetryStore';
import { ExpandedState } from '../states/ExpandedState';
import { CalendarPanel } from './CalendarPanel';

export function ModuleDashboard({ onCollapse, widgetOrchestration }: {
  onCollapse: () => void;
  widgetOrchestration?: WidgetOrchestration;
}) {
  const selected = useIslandStore((store) => store.selectedModule);
  const pinned = useIslandStore((store) => store.pinned);
  const settings = useSettingsStore((store) => store.settings.widgets);
  const modules = availableModules(settings);
  const requested = selected ?? widgetOrchestration?.primary ?? 'calendar';
  const current = modules.find((module) => module.id === requested) ?? modules[0];
  const cpu = useTelemetryStore((store) => store.cpu);
  const ram = useTelemetryStore((store) => store.ram);
  const hasSample = useTelemetryStore((store) => store.hasSample);

  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = modules.indexOf(current);
    const next = event.key === 'ArrowRight' ? (index + 1) % modules.length
      : event.key === 'ArrowLeft' ? (index - 1 + modules.length) % modules.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? modules.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    useIslandStore.getState().selectModule(modules[next].id);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div className="module-dashboard">
      <header className="module-dashboard__header">
        <div><span className="pill-wordmark">PILL<span aria-hidden="true">●</span></span><p>A little closer to your day</p></div>
        <div className="module-dashboard__actions">
          <button type="button" className={pinned ? 'is-active' : ''} aria-label={pinned ? 'Unpin island' : 'Pin island open'} aria-pressed={pinned} onClick={() => useIslandStore.getState().setPinned(!pinned)} title={pinned ? 'Unpin island' : 'Keep open for this session'}>{pinned ? 'Pinned' : 'Pin'}</button>
          <button type="button" aria-label="Collapse island" onClick={onCollapse}>×</button>
        </div>
      </header>
      <div className="module-tabs" role="tablist" aria-label="Island modules" onKeyDown={navigate}>
        {modules.map((module) => (
          <button type="button" role="tab" key={module.id} id={`tab-${module.id}`} aria-controls={`panel-${module.id}`} aria-selected={current.id === module.id} tabIndex={current.id === module.id ? 0 : -1} onClick={() => useIslandStore.getState().selectModule(module.id)}>{module.label}</button>
        ))}
      </div>
      <div className="module-panel" id={`panel-${current.id}`} role="tabpanel" aria-labelledby={`tab-${current.id}`} tabIndex={0}>
        {current.id === 'calendar' ? <CalendarPanel />
          : current.id === 'telemetry' ? (
            <section className="system-panel" aria-label="System performance">
              <div><span className="module-eyebrow">ON THIS PC</span><h2>Room to breathe.</h2><p>{hasSample ? 'Live CPU and memory usage' : 'Waiting for system data'}</p></div>
              {([['CPU', cpu], ['Memory', ram]] as const).map(([label, value]) => (
                <div className="system-panel__metric" key={label}><div><span>{label}</span><strong>{hasSample ? <>{Math.round(value)}<small>%</small></> : 'N/A'}</strong></div>{hasSample && <meter min={0} max={100} value={value} aria-label={`${label} usage`} />}</div>
              ))}
            </section>
          ) : <ExpandedState embedded selectedModule={current.id} onCollapse={onCollapse} widgetOrchestration={widgetOrchestration} />}
      </div>
      <footer className="module-dashboard__footer"><span className="status-dot" aria-hidden="true" />{current.id === 'calendar' ? 'Your local time' : current.id === 'media' ? 'Windows media session' : current.id === 'focusTimer' ? 'Make time for what matters' : 'System telemetry'}<span>Made for your desktop</span></footer>
    </div>
  );
}
