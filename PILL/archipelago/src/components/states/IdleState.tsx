import { useClock } from '../../hooks/useClock';
import { useWeatherStore } from '../../store/weatherStore';
import { useSettingsStore } from '../../store/settingsStore';
import { matchesWeather } from '../../../../shared/weather/types';
import { weatherDescription } from '../../lib/weatherPresentation';

export function IdleState() {
  const now = useClock();
  const settings = useSettingsStore((store) => store.settings.weather);
  const snapshot = useWeatherStore((store) => store.data);
  const stale = useWeatherStore((store) => store.status === 'stale');
  const weather = snapshot && matchesWeather(snapshot, settings) ? snapshot : null;
  return (
    <div className="state-idle">
      <span className="idle-clock__dot" aria-hidden="true" />
      <time dateTime={now.toISOString()} className="idle-clock__time">
        {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
      </time>
      <span className="idle-clock__date" title={weather ? `${weather.location.name}${stale ? ' · Cached weather' : ''}` : undefined}>{weather ? <><span aria-hidden="true">{weatherDescription(weather.code, weather.isDay).icon}</span> {Math.round(weather.temperature)}°{weather.unit === 'fahrenheit' ? 'F' : 'C'}{stale ? ' ·' : ''}</> : now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
    </div>
  );
}
