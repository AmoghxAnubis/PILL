import { useClock } from '../../hooks/useClock';
import { openUrl } from '@tauri-apps/plugin-opener';
import { openControl } from '../../lib/settingsActions';
import { weatherDescription, windDirection } from '../../lib/weatherPresentation';
import { matchesWeather } from '../../../../shared/weather/types';
import { useSettingsStore } from '../../store/settingsStore';
import { useWeatherStore } from '../../store/weatherStore';

export function WeatherPanel() {
  const now = useClock();
  const settings = useSettingsStore((store) => store.settings.weather);
  const weather = useWeatherStore();
  const data = weather.data && matchesWeather(weather.data, settings) ? weather.data : null;
  if (!settings.enabled || !settings.location) return (
    <section className="weather-panel weather-panel--empty"><span className="weather-panel__icon" aria-hidden="true">☀</span><h2>Your weather, at a glance.</h2><p>Choose a city and enable weather in PILL Control.</p><button type="button" onClick={openControl}>Set up weather</button></section>
  );
  if (!data) return (
    <section className="weather-panel weather-panel--empty" aria-live="polite"><h2>{weather.status === 'error' ? 'Weather unavailable' : 'Checking the skies…'}</h2><p>{weather.error ?? settings.location.name}</p>{weather.status === 'error' && <button type="button" onClick={weather.refresh} disabled={weather.refreshing || now.getTime() - weather.lastAttempt < 60_000}>Retry</button>}<p className="weather-panel__source">Open-Meteo · Internet connection required</p></section>
  );
  const condition = weatherDescription(data.code, data.isDay);
  const stale = weather.status === 'stale' || now.getTime() - data.fetchedAt >= 15 * 60_000;
  return (
    <section className="weather-panel" aria-label={`Weather in ${data.location.name}`}>
      <div className="weather-panel__summary"><div><span className="module-eyebrow">{data.location.name}</span><h2>{Math.round(data.temperature)}<small>°{data.unit === 'fahrenheit' ? 'F' : 'C'}</small></h2><p>{condition.label}</p></div><span className="weather-panel__icon" aria-hidden="true">{condition.icon}</span></div>
      <dl className="weather-panel__details"><div><dt>Feels like</dt><dd>{Math.round(data.apparentTemperature)}°</dd></div><div><dt>Humidity</dt><dd>{Math.round(data.humidity)}%</dd></div><div><dt>Wind</dt><dd>{Math.round(data.windSpeed)} {data.unit === 'fahrenheit' ? 'mph' : 'km/h'} {windDirection(data.windDirection)}</dd></div></dl>
      <p className="weather-panel__source" role="status">{stale ? 'Cached · ' : ''}Updated {new Date(data.fetchedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}{weather.refreshing ? ' · Refreshing' : ''}</p>
      {weather.error && <p className="weather-panel__error">{weather.error}</p>}
      <p className="weather-panel__source">Weather data: <button type="button" className="weather-panel__link" onClick={() => { void openUrl('https://open-meteo.com/').catch(() => {}); }}>Open-Meteo</button> · <button type="button" className="weather-panel__link" onClick={() => { void openUrl('https://creativecommons.org/licenses/by/4.0/').catch(() => {}); }}>CC BY 4.0</button></p>
    </section>
  );
}
