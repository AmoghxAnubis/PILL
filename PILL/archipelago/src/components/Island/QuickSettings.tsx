import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { SettingsPatch, ThemeMode } from '../../../../shared/settings/PillSettings';
import { openControl, persistPin, persistSettingsPatch } from '../../lib/settingsActions';
import { useIslandStore } from '../../store/islandStore';
import { useSettingsStore } from '../../store/settingsStore';

export function QuickSettings({ onClose }: { onClose: () => void }) {
  const settings = useSettingsStore((store) => store.settings);
  const status = useSettingsStore((store) => store.saveStatus);
  const error = useSettingsStore((store) => store.saveError ?? store.loadError);
  const pinned = useIslandStore((store) => store.pinned);
  const dialog = useRef<HTMLDivElement>(null);
  const busy = status === 'saving';
  useEffect(() => { dialog.current?.querySelector<HTMLButtonElement>('button')?.focus(); }, []);
  const save = (patch: SettingsPatch) => { void persistSettingsPatch(patch).catch(() => {}); };
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
    if (event.key !== 'Tab') return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('*'))
      .filter((element) => ['BUTTON', 'SELECT', 'INPUT'].includes(element.tagName) && !element.hasAttribute('disabled'));
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  return (
    <div ref={dialog} className="quick-settings" role="dialog" aria-modal="true" aria-label="PILL quick settings" onKeyDown={keyDown}>
      <header><div><span className="pill-wordmark">PILL</span><h2>Make it yours</h2></div><button type="button" aria-label="Close quick settings" onClick={onClose}>×</button></header>
      <div className="quick-settings__body">
        <label>Keep expanded<input type="checkbox" checked={pinned} disabled={busy} onChange={(event) => persistPin(event.target.checked)} /></label>
        <label>Theme<select value={settings.appearance.theme} disabled={busy} onChange={(event) => save({ appearance: { theme: event.target.value as ThemeMode } })}>{[['dark','Black'],['light','Light'],['system','System'],['graphite','Graphite'],['blue','Midnight blue'],['purple','Deep purple'],['fluent','Fluent inspired']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Shape<select value={settings.appearance.shape} disabled={busy} onChange={(event) => save({ appearance: { shape: event.target.value as 'pill' | 'panel' } })}><option value="pill">Pill</option><option value="panel">Windows-style panel</option></select></label>
        <label>Background opacity<select value={settings.appearance.opacity} disabled={busy} onChange={(event) => save({ appearance: { opacity: Number(event.target.value) } })}>{[1, .85, .7, .55].map((value) => <option key={value} value={value}>{Math.round(value * 100)}%</option>)}</select></label>
        <label>Size<select value={settings.appearance.scale} disabled={busy} onChange={(event) => save({ appearance: { scale: Number(event.target.value) } })}>{[.85, 1, 1.1, 1.25].map((value) => <option key={value} value={value}>{Math.round(value * 100)}%</option>)}</select></label>
        <label>Expand on hover<input type="checkbox" checked={settings.behavior.hoverToExpand} disabled={busy} onChange={(event) => save({ behavior: { hoverToExpand: event.target.checked } })} /></label>
        <label>Expand on click<input type="checkbox" checked={settings.behavior.clickToExpand} disabled={busy} onChange={(event) => save({ behavior: { clickToExpand: event.target.checked } })} /></label>
      </div>
      {error && <p className="quick-settings__error" role="alert">{error}</p>}
      <footer><span role="status">{busy ? 'Saving…' : status === 'error' ? 'Not saved' : status === 'saved' ? 'Saved locally' : 'Preferences'}</span><button type="button" onClick={() => { onClose(); openControl(); }}>Open PILL Control ↗</button></footer>
    </div>
  );
}
