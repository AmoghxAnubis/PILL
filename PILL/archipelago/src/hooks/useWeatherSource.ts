import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { matchesWeather, weatherKey, type WeatherSnapshot } from '../../../shared/weather/types';
import { useSettingsStore } from '../store/settingsStore';
import { useWeatherStore } from '../store/weatherStore';

const REFRESH_MS = 15 * 60_000;

export function useWeatherSource(): void {
  const configuration = useSettingsStore((store) => store.settings.weather);
  const key = weatherKey(configuration);
  const refresh = useWeatherStore((store) => store.refreshVersion);
  useEffect(() => {
    const settings = useSettingsStore.getState().settings.weather;
    if (!settings.enabled || !settings.location) {
      useWeatherStore.setState({ status: settings.enabled ? 'unconfigured' : 'disabled', data: null, error: null, refreshing: false });
      return;
    }
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    const oldData = useWeatherStore.getState().data;
    const data = oldData && matchesWeather(oldData, settings) ? oldData : null;
    useWeatherStore.setState({ data, status: data ? 'stale' : 'loading', error: null, refreshing: true });

    const run = async () => {
      if (disposed) return;
      useWeatherStore.setState({ refreshing: true, lastAttempt: Date.now() });
      try {
        const snapshot = await invoke<WeatherSnapshot>('get_weather');
        if (disposed) return;
        if (!matchesWeather(snapshot, settings)) throw new Error('Weather location changed. Please retry.');
        failures = 0;
        useWeatherStore.setState({ data: snapshot, status: Date.now() - snapshot.fetchedAt >= REFRESH_MS ? 'stale' : 'ready', error: null });
      } catch (error) {
        if (disposed) return;
        failures += 1;
        const cached = useWeatherStore.getState().data;
        const usable = cached && Date.now() - cached.fetchedAt <= 24 * 60 * 60_000 ? cached : null;
        useWeatherStore.setState({ data: usable, status: usable ? 'stale' : 'error', error: String(error) });
      } finally {
        if (!disposed) {
          useWeatherStore.setState({ refreshing: false });
          timer = setTimeout(() => { void run(); }, failures ? Math.min(REFRESH_MS, 60_000 * 2 ** (failures - 1)) : REFRESH_MS);
        }
      }
    };

    void (async () => {
      try {
        const cached = await invoke<WeatherSnapshot | null>('load_cached_weather');
        if (!disposed && cached && matchesWeather(cached, settings)) {
          useWeatherStore.setState({ data: cached, status: 'stale' });
        }
      } catch { /* Cache failure must not prevent an online attempt. */ }
      await run();
    })();
    return () => { disposed = true; clearTimeout(timer); };
  }, [key, refresh]);
}
