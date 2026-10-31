import type { TemperatureUnit, WeatherLocation, WeatherSettings } from '../settings/PillSettings';
export interface WeatherSnapshot {
  location: WeatherLocation; unit: TemperatureUnit; fetchedAt: number; observedAt: number;
  temperature: number; apparentTemperature: number; humidity: number;
  windSpeed: number; windDirection: number; code: number; isDay: boolean;
}
export function weatherKey(settings: WeatherSettings): string {
  return JSON.stringify([settings.enabled, settings.location, settings.unit]);
}
export function matchesWeather(snapshot: WeatherSnapshot, settings: WeatherSettings): boolean {
  const location = settings.location;
  return settings.enabled && location !== null && snapshot.location.id === location.id
    && snapshot.location.latitude === location.latitude && snapshot.location.longitude === location.longitude
    && snapshot.unit === settings.unit;
}
