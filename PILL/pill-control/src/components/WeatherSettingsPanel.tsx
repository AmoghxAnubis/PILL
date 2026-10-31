import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { WeatherLocation, WeatherSettings } from '../../../shared/settings/PillSettings';

export function WeatherSettingsPanel({ settings, disabled, onChange }: {
  settings: WeatherSettings; disabled: boolean; onChange: (patch: Partial<WeatherSettings>) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WeatherLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    const current = ++generation.current;
    setSearching(true); setError(null); setResults([]); setSearched(false);
    try {
      const locations = await invoke<WeatherLocation[]>('search_weather_locations', { query });
      if (current === generation.current) { setResults(locations); setSearched(true); }
    } catch (reason) {
      if (current === generation.current) setError(String(reason));
    } finally {
      if (current === generation.current) setSearching(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-heading"><span className="page-heading__eyebrow">WEATHER</span><h1>A forecast close at hand</h1><p>Choose the city shown in your island. Weather uses an internet connection.</p></div>
      <div className="settings-card">
        <div className="setting-row"><div className="setting-row__content"><div className="setting-row__label">Weather in the island</div><p className="setting-row__description">Fetch weather only when enabled and a city is selected.</p></div><input type="checkbox" aria-label="Enable weather" checked={settings.enabled} disabled={disabled} onChange={(event) => onChange({ enabled: event.target.checked })} /></div>
        <div className="setting-row"><div className="setting-row__content"><div className="setting-row__label">Selected city</div><p className="setting-row__description">{settings.location ? [settings.location.name, settings.location.region, settings.location.country].filter(Boolean).join(', ') : 'No city selected'}</p></div>{settings.location && <button type="button" className="text-button" disabled={disabled} onClick={() => onChange({ location: null, enabled: false })}>Clear</button>}</div>
        <div className="setting-row"><label htmlFor="weather-unit" className="setting-row__label">Temperature and wind units</label><select id="weather-unit" className="select-control" value={settings.unit} disabled={disabled} onChange={(event) => onChange({ unit: event.target.value as WeatherSettings['unit'] })}><option value="celsius">Celsius · km/h</option><option value="fahrenheit">Fahrenheit · mph</option></select></div>
        <form className="weather-search" onSubmit={(event) => { void search(event); }}>
          <label htmlFor="weather-city">Search for a city</label>
          <div><input id="weather-city" type="search" placeholder="City, country or region" value={query} disabled={disabled} maxLength={160} onChange={(event) => { generation.current += 1; setQuery(event.target.value); setResults([]); setSearched(false); setSearching(false); }} /><button type="submit" className="secondary-button" disabled={disabled || searching || query.trim().length < 2}>{searching ? 'Searching…' : 'Search'}</button></div>
          <p className="setting-row__description">Search sends your query to Open-Meteo. Selecting a result enables weather for that city.</p>
        </form>
        {error && <p role="alert" className="settings-error">{error}</p>}
        {searched && results.length === 0 && <p className="weather-search__empty" role="status">No cities found. Try including a country or region.</p>}
        <ul className="weather-search__results" aria-label="Matching cities">{results.map((location) => <li key={location.id}><button type="button" disabled={disabled} aria-pressed={settings.location?.id === location.id} onClick={() => onChange({ location, enabled: true })}><strong>{location.name}</strong><span>{[location.region, location.country].filter(Boolean).join(', ')}</span></button></li>)}</ul>
      </div>
      <div className="info-banner"><span>Weather data: Open-Meteo, CC BY 4.0. The bundled free endpoint is for non-commercial use. Forecasts refresh about every 15 minutes; cached readings are labelled if offline.</span></div>
    </div>
  );
}
