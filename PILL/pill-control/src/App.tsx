import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  DEFAULT_PILL_SETTINGS,
  type PillSettings,
  type ThemeMode,
  type SettingsPatch,
} from '../../shared/settings/PillSettings';

import {
  loadSettings,
  patchSettings,
  resetSavedSettings,
} from './lib/settingsApi';

import { mergeSettings } from '../../shared/settings/merge';
import { WeatherSettingsPanel } from './components/WeatherSettingsPanel';
import './App.css';

type Section =
  | 'overview'
  | 'widgets'
  | 'behavior'
  | 'appearance'
  | 'system'
  | 'weather';

const SECTION_LABELS: Record<Section, string> = {
  overview: 'Overview',
  widgets: 'Widgets',
  behavior: 'Behavior',
  appearance: 'Appearance',
  system: 'System',
  weather: 'Weather',
};

interface SettingToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
}

function SettingToggle({
  checked,
  onChange,
  label,
  description,
}: SettingToggleProps) {
  return (
    <div className="setting-row">
      <div className="setting-row__content">
        <div className="setting-row__label">
          {label}
        </div>

        <div className="setting-row__description">
          {description}
        </div>
      </div>

      <button
        type="button"
        className={`toggle ${
          checked ? 'toggle--active' : ''
        }`}
        aria-pressed={checked}
        aria-label={`${label}: ${
          checked ? 'On' : 'Off'
        }`}
        onClick={onChange}
      >
        <span className="toggle__thumb" />
      </button>
    </div>
  );
}

function SectionIcon({
  section,
}: {
  section: Section;
}) {
  const icons: Record<Section, string> = {
    overview: '⌂',
    widgets: '◈',
    behavior: '◌',
    appearance: '◐',
    system: '⚙',
    weather: '☀',
  };

  return (
    <span
      className="nav-item__icon"
      aria-hidden="true"
    >
      {icons[section]}
    </span>
  );
}

function App() {
  const [activeSection, setActiveSection] =
    useState<Section>('widgets');

  const [settings, setSettings] =
    useState<PillSettings>(
      DEFAULT_PILL_SETTINGS,
    );

  const saveGeneration = useRef(0);
  const pendingWrites = useRef(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [settingsLoaded, setSettingsLoaded] =
    useState(false);

  const [saveStatus, setSaveStatus] =
    useState<
      'idle' | 'saving' | 'saved' | 'error'
    >('idle');

  /*
   * Load the persisted settings when PILL Control
   * starts.
   *
   * Until loading completes, update handlers are
   * guarded so a user cannot accidentally overwrite
   * the persisted configuration with the defaults.
   */
  useEffect(() => {
    let mounted = true;

    void loadSettings().then((loadedSettings) => {
      if (!mounted) {
        return;
      }

      setSettings(loadedSettings);
      setSettingsLoaded(true);
      setSaveStatus('saved');
    }).catch((error) => {
      if (mounted) { setErrorMessage(String(error)); setSaveStatus('error'); }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const enabledWidgetCount = useMemo(
    () =>
      Object.values(settings.widgets).filter(
        Boolean,
      ).length,
    [settings.widgets],
  );

  useEffect(() => {
    if (!settingsLoaded) return;
    let mounted = true;
    const timer = setInterval(() => {
      if (pendingWrites.current > 0) return;
      void loadSettings().then((incoming) => {
        if (mounted && pendingWrites.current === 0) setSettings((current) => incoming.revision > current.revision ? incoming : current);
      }).catch(() => { /* Preserve the last valid settings if a read fails. */ });
    }, 500);
    return () => { mounted = false; clearInterval(timer); };
  }, [settingsLoaded]);

  const commitSettings = (patch: SettingsPatch) => {
    if (!settingsLoaded) return;
    const generation = ++saveGeneration.current;
    pendingWrites.current += 1;
    setSettings((current) => mergeSettings(current, patch));
    setSaveStatus('saving'); setErrorMessage(null);
    void patchSettings(patch).then((saved) => {
      if (generation === saveGeneration.current) { setSettings(saved); setSaveStatus('saved'); }
    }).catch((error) => {
      if (generation === saveGeneration.current) { setSaveStatus('error'); setErrorMessage(String(error)); }
      void loadSettings().then((saved) => {
        if (generation === saveGeneration.current) setSettings(saved);
      }).catch(() => {});
    }).finally(() => { pendingWrites.current -= 1; });
  };
  const updateWidgets = (widgets: Partial<PillSettings['widgets']>) => commitSettings({ widgets });
  const updateBehavior = (behavior: Partial<PillSettings['behavior']>) => commitSettings({ behavior });
  const updateAppearance = (appearance: Partial<PillSettings['appearance']>) => commitSettings({ appearance });
  const updateSystem = (system: Partial<PillSettings['system']>) => commitSettings({ system });
  const resetSettings = () => {
    if (!settingsLoaded) return;
    const generation = ++saveGeneration.current;
    pendingWrites.current += 1;
    setSaveStatus('saving'); setErrorMessage(null);
    void resetSavedSettings().then((saved) => {
      if (generation === saveGeneration.current) { setSettings(saved); setSaveStatus('saved'); }
    }).catch((error) => {
      if (generation === saveGeneration.current) { setSaveStatus('error'); setErrorMessage(String(error)); }
    }).finally(() => { pendingWrites.current -= 1; });
  };

  const renderOverview = () => (
    <div className="page-content">
      <div className="page-heading">
        <span className="page-heading__eyebrow">
          CONTROL CENTER
        </span>

        <h1>PILL at a glance</h1>

        <p>
          Configure what PILL shows and how it
          behaves.
        </p>
      </div>

      <div className="overview-status">
        <div className="status-card">
          <div className="status-card__indicator status-card__indicator--active" />

          <div>
            <div className="status-card__label">
              Configuration
            </div>

            <div className="status-card__value">
              Local settings
            </div>
          </div>
        </div>

        <div className="status-card">
          <div className="status-card__indicator" />

          <div>
            <div className="status-card__label">
              Widgets enabled
            </div>

            <div className="status-card__value">
              {enabledWidgetCount} / 3
            </div>
          </div>
        </div>
      </div>

      <section className="overview-section">
        <div className="section-header">
          <div>
            <h2>Active widgets</h2>

            <p>
              Choose which experiences PILL is
              allowed to surface.
            </p>
          </div>

          <button
            type="button"
            className="text-button"
            onClick={() =>
              setActiveSection('widgets')
            }
          >
            Manage widgets
          </button>
        </div>

        <div className="widget-summary-grid">
          <div
            className={`summary-card ${
              settings.widgets.media
                ? 'summary-card--enabled'
                : ''
            }`}
          >
            <span className="summary-card__icon">
              ▶
            </span>

            <span className="summary-card__name">
              Media
            </span>

            <span className="summary-card__state">
              {settings.widgets.media
                ? 'Enabled'
                : 'Disabled'}
            </span>
          </div>

          <div
            className={`summary-card ${
              settings.widgets.telemetry
                ? 'summary-card--enabled'
                : ''
            }`}
          >
            <span className="summary-card__icon">
              ◌
            </span>

            <span className="summary-card__name">
              Telemetry
            </span>

            <span className="summary-card__state">
              {settings.widgets.telemetry
                ? 'Enabled'
                : 'Disabled'}
            </span>
          </div>

          <div
            className={`summary-card ${
              settings.widgets.focusTimer
                ? 'summary-card--enabled'
                : ''
            }`}
          >
            <span className="summary-card__icon">
              ◷
            </span>

            <span className="summary-card__name">
              Focus Timer
            </span>

            <span className="summary-card__state">
              {settings.widgets.focusTimer
                ? 'Enabled'
                : 'Disabled'}
            </span>
          </div>
        </div>
      </section>

      <section className="overview-section">
        <div className="section-header">
          <div>
            <h2>Behavior</h2>

            <p>
              Control how PILL reveals and hides
              itself.
            </p>
          </div>

          <button
            type="button"
            className="text-button"
            onClick={() =>
              setActiveSection('behavior')
            }
          >
            Open behavior
          </button>
        </div>

        <div className="mini-settings">
          <div className="mini-setting">
            <span>Hover to expand</span>

            <span
              className={`mini-setting__value ${
                settings.behavior.hoverToExpand
                  ? 'mini-setting__value--on'
                  : ''
              }`}
            >
              {settings.behavior.hoverToExpand
                ? 'ON'
                : 'OFF'}
            </span>
          </div>

          <div className="mini-setting">
            <span>Fullscreen evasion</span>

            <span
              className={`mini-setting__value ${
                settings.behavior
                  .fullscreenEvasion
                  ? 'mini-setting__value--on'
                  : ''
              }`}
            >
              {settings.behavior
                .fullscreenEvasion
                ? 'ON'
                : 'OFF'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );

  const renderWidgets = () => (
    <div className="page-content">
      <div className="page-heading">
        <span className="page-heading__eyebrow">
          WIDGETS
        </span>

        <h1>Choose what PILL shows</h1>

        <p>
          Disabled widgets are excluded from PILL's
          active widget orchestration.
        </p>
      </div>

      <div className="settings-card">
        <SettingToggle
          checked={settings.widgets.media}
          onChange={() =>
            updateWidgets({
              media: !settings.widgets.media,
            })
          }
          label="Media"
          description="Show currently playing media and playback information."
        />

        <SettingToggle
          checked={settings.widgets.telemetry}
          onChange={() =>
            updateWidgets({
              telemetry:
                !settings.widgets.telemetry,
            })
          }
          label="Telemetry"
          description="Allow CPU and RAM information to appear inside PILL."
        />

        <SettingToggle
          checked={settings.widgets.focusTimer}
          onChange={() =>
            updateWidgets({
              focusTimer:
                !settings.widgets.focusTimer,
            })
          }
          label="Focus Timer"
          description="Allow the focus timer and its controls to appear inside PILL."
        />
      </div>

      <div className="info-banner">
        <span className="info-banner__icon">
          i
        </span>

        <span>
          Changes are saved automatically to your
          local PILL configuration.
        </span>
      </div>
    </div>
  );

  const renderBehavior = () => (
    <div className="page-content">
      <div className="page-heading">
        <span className="page-heading__eyebrow">
          BEHAVIOR
        </span>

        <h1>Control PILL's behavior</h1>

        <p>
          Decide how PILL reacts to interaction and
          fullscreen applications.
        </p>
      </div>

      <div className="settings-card">
        <SettingToggle checked={settings.behavior.pinExpanded} onChange={() => updateBehavior({ pinExpanded: !settings.behavior.pinExpanded })} label="Keep expanded" description="Keep the island open until you unpin or explicitly collapse it. This preference is saved." />

        <SettingToggle
          checked={
            settings.behavior.hoverToExpand
          }
          onChange={() =>
            updateBehavior({
              hoverToExpand:
                !settings.behavior
                  .hoverToExpand,
            })
          }
          label="Hover to expand"
          description="Reveal the compact pill when the pointer reaches the island."
        />

        <SettingToggle
          checked={
            settings.behavior.clickToExpand
          }
          onChange={() =>
            updateBehavior({
              clickToExpand:
                !settings.behavior
                  .clickToExpand,
            })
          }
          label="Click to expand"
          description="Open the expanded dashboard when the compact pill is clicked."
        />

        <SettingToggle
          checked={
            settings.behavior.autoCollapse
          }
          onChange={() =>
            updateBehavior({
              autoCollapse:
                !settings.behavior
                  .autoCollapse,
            })
          }
          label="Auto-collapse"
          description="Allow PILL to return to its collapsed state automatically."
        />

        <SettingToggle
          checked={
            settings.behavior
              .fullscreenEvasion
          }
          onChange={() =>
            updateBehavior({
              fullscreenEvasion:
                !settings.behavior
                  .fullscreenEvasion,
            })
          }
          label="Fullscreen evasion"
          description="Hide PILL while a fullscreen application is active."
        />

        <div className="range-setting">
          <div className="range-setting__header">
            <div>
              <div className="setting-row__label">
                Collapse delay
              </div>

              <div className="setting-row__description">
                Delay before an inactive compact
                pill collapses.
              </div>
            </div>

            <span className="range-setting__value">
              {settings.behavior
                .collapseDelayMs}{' '}
              ms
            </span>
          </div>

          <input
            type="range"
            min="250"
            max="2000"
            step="50"
            value={
              settings.behavior
                .collapseDelayMs
            }
            onChange={(event) =>
              updateBehavior({
                collapseDelayMs:
                  Number(event.target.value),
              })
            }
          />
        </div>
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="page-content">
      <div className="page-heading">
        <span className="page-heading__eyebrow">
          APPEARANCE
        </span>

        <h1>Shape the experience</h1>

        <p>
          Configure the visual behavior of PILL.
        </p>
      </div>

      <div className="settings-card">
        <div className="setting-row">
          <div className="setting-row__content">
            <div className="setting-row__label">
              Theme
            </div>

            <div className="setting-row__description">
              Select the visual theme used by PILL.
            </div>
          </div>

          <select
            className="select-control"
            value={settings.appearance.theme}
            onChange={(event) =>
              updateAppearance({
                theme: event.target
                  .value as ThemeMode,
              })
            }
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
            <option value="graphite">Graphite</option>
            <option value="blue">Midnight blue</option>
            <option value="purple">Deep purple</option>
            <option value="fluent">Fluent inspired</option>
          </select>
        </div>

        <div className="setting-row"><label className="setting-row__label" htmlFor="island-shape">Shape</label><select id="island-shape" className="select-control" value={settings.appearance.shape} disabled={!settingsLoaded} onChange={(event) => updateAppearance({ shape: event.target.value as PillSettings['appearance']['shape'] })}><option value="pill">Pill</option><option value="panel">Windows-style panel</option></select></div>
        <div className="setting-row"><label className="setting-row__label" htmlFor="island-opacity">Background opacity</label><select id="island-opacity" className="select-control" value={settings.appearance.opacity} disabled={!settingsLoaded} onChange={(event) => updateAppearance({ opacity: Number(event.target.value) })}>{[1, 0.85, 0.7, 0.55].map((value) => <option key={value} value={value}>{Math.round(value * 100)}%</option>)}</select></div>
        <div className="setting-row"><label className="setting-row__label" htmlFor="island-scale">Island size</label><select id="island-scale" className="select-control" value={settings.appearance.scale} disabled={!settingsLoaded} onChange={(event) => updateAppearance({ scale: Number(event.target.value) })}>{[0.85, 1, 1.1, 1.25].map((value) => <option key={value} value={value}>{Math.round(value * 100)}%</option>)}</select></div>

        <SettingToggle
          checked={
            settings.appearance.animations
          }
          onChange={() =>
            updateAppearance({
              animations:
                !settings.appearance
                  .animations,
            })
          }
          label="Animations"
          description="Allow PILL's normal transition and motion effects."
        />
      </div>
    </div>
  );

  const renderSystem = () => (
    <div className="page-content">
      <div className="page-heading">
        <span className="page-heading__eyebrow">
          SYSTEM
        </span>

        <h1>System preferences</h1>

        <p>
          Configure how PILL behaves with Windows.
        </p>
      </div>

      <div className="settings-card">
        <SettingToggle
          checked={
            settings.system.launchAtStartup
          }
          onChange={() =>
            updateSystem({
              launchAtStartup:
                !settings.system
                  .launchAtStartup,
            })
          }
          label="Launch at startup"
          description="Start PILL automatically when Windows starts."
        />

        <SettingToggle
          checked={
            settings.system.minimizeToTray
          }
          onChange={() =>
            updateSystem({
              minimizeToTray:
                !settings.system
                  .minimizeToTray,
            })
          }
          label="Minimize to tray"
          description="Keep PILL Control available from the Windows system tray."
        />
      </div>

      <div className="danger-card">
        <div>
          <div className="setting-row__label">
            Reset settings
          </div>

          <div className="setting-row__description">
            Restore the original PILL preferences.
          </div>
        </div>

        <button
          type="button"
          className="danger-button"
          onClick={resetSettings}
        >
          Reset
        </button>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();

      case 'widgets':
        return renderWidgets();

      case 'behavior':
        return renderBehavior();

      case 'appearance':
        return renderAppearance();

      case 'system':
        return renderSystem();

      case 'weather':
        return <WeatherSettingsPanel settings={settings.weather} disabled={!settingsLoaded} onChange={(weather) => commitSettings({ weather })} />;

      default:
        return renderWidgets();
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark">
            P
          </div>

          <div>
            <div className="brand__name">
              PILL
            </div>

            <div className="brand__subtitle">
              Control
            </div>
          </div>
        </div>

        <div className="sidebar__label">
          CONFIGURE
        </div>

        <nav className="navigation">
          {(Object.keys(
            SECTION_LABELS,
          ) as Section[]).map((section) => (
            <button
              key={section}
              type="button"
              className={`nav-item ${
                activeSection === section
                  ? 'nav-item--active'
                  : ''
              }`}
              onClick={() =>
                setActiveSection(section)
              }
            >
              <SectionIcon section={section} />

              <span>
                {SECTION_LABELS[section]}
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="connection-dot" />

          <div>
            <div className="sidebar__footer-title">
              PILL Control
            </div>

            <div className="sidebar__footer-text">
              Configuration workspace
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar__breadcrumb">
            PILL
            <span>/</span>
            {SECTION_LABELS[activeSection]}
          </div>

          <div className="topbar__status">
            <span
              className={`topbar__status-dot ${
                saveStatus === 'error'
                  ? 'topbar__status-dot--error'
                  : ''
              }`}
            />

            {saveStatus === 'error' ? 'Settings unavailable'
              : !settingsLoaded
              ? 'Loading settings'
              : saveStatus === 'saving'
                ? 'Saving'
                : 'Saved locally'}
          </div>
        </header>

        {errorMessage && <p role="alert" className="settings-error">{errorMessage}</p>}
        {renderSection()}
      </main>
    </div>
  );
}

export default App;
