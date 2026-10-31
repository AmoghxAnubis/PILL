import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { DEFAULT_PILL_SETTINGS } from '../../../shared/settings/PillSettings';
import type { WeatherSnapshot } from '../../../shared/weather/types';
import { useSettingsStore } from '../store/settingsStore';
import { useWeatherStore } from '../store/weatherStore';
import { useWeatherSource } from './useWeatherSource';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
const call = vi.mocked(invoke);
const location = { id: 1, name: 'Test City', region: 'Test', country: 'Test', latitude: 10, longitude: 20 };
const settings = { ...DEFAULT_PILL_SETTINGS, weather: { enabled: true, location, unit: 'celsius' as const } };
const snapshot = (): WeatherSnapshot => ({ location, unit: 'celsius', fetchedAt: Date.now(), observedAt: Date.now(), temperature: 20, apparentTemperature: 19, humidity: 60, windSpeed: 10, windDirection: 90, code: 2, isDay: true });

beforeEach(() => {
  vi.useFakeTimers(); call.mockReset();
  useSettingsStore.setState({ settings });
  useWeatherStore.setState({ status: 'disabled', data: null, error: null, refreshing: false, refreshVersion: 0, lastAttempt: 0 });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
const flush = async () => { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); };

describe('weather source lifecycle', () => {
  it('does not make requests while disabled or without a city', async () => {
    useSettingsStore.setState({ settings: DEFAULT_PILL_SETTINGS });
    renderHook(useWeatherSource);
    await flush();
    expect(call).not.toHaveBeenCalled();
    act(() => useSettingsStore.setState({ settings: { ...settings, weather: { ...settings.weather, location: null } } }));
    expect(useWeatherStore.getState().status).toBe('unconfigured');
    expect(call).not.toHaveBeenCalled();
  });

  it('retains a cached reading on failure and retries with backoff', async () => {
    const cached = { ...snapshot(), fetchedAt: Date.now() - 30 * 60_000 };
    call.mockResolvedValueOnce(cached).mockRejectedValueOnce('Offline');
    renderHook(useWeatherSource);
    await flush();
    expect(useWeatherStore.getState()).toMatchObject({ status: 'stale', data: cached, error: 'Offline', refreshing: false });
    const fresh = snapshot();
    call.mockResolvedValueOnce(fresh);
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(useWeatherStore.getState()).toMatchObject({ status: 'ready', data: fresh, error: null });
  });

  it('ignores responses from an old city after settings change', async () => {
    let finishOld!: (value: WeatherSnapshot) => void;
    call.mockResolvedValueOnce(null).mockImplementationOnce(() => new Promise<WeatherSnapshot>((resolve) => { finishOld = resolve; }) as ReturnType<typeof invoke>);
    renderHook(useWeatherSource);
    await flush();
    const changed = { ...location, id: 2, name: 'Other City', latitude: 30 };
    const latest = { ...snapshot(), location: changed };
    call.mockResolvedValueOnce(null).mockResolvedValueOnce(latest);
    act(() => useSettingsStore.setState({ settings: { ...settings, weather: { ...settings.weather, location: changed } } }));
    await flush();
    await act(async () => { finishOld(snapshot()); });
    expect(useWeatherStore.getState().data).toEqual(latest);
  });

  it('stops refreshes and ignores an in-flight result when disabled', async () => {
    let finish!: (value: WeatherSnapshot) => void;
    call.mockResolvedValueOnce(null).mockImplementationOnce(() => new Promise<WeatherSnapshot>((resolve) => { finish = resolve; }) as ReturnType<typeof invoke>);
    renderHook(useWeatherSource);
    await flush();
    act(() => useSettingsStore.setState({ settings: DEFAULT_PILL_SETTINGS }));
    await act(async () => { finish(snapshot()); await vi.advanceTimersByTimeAsync(60 * 60_000); });
    expect(useWeatherStore.getState()).toMatchObject({ status: 'disabled', data: null, refreshing: false });
    expect(call).toHaveBeenCalledTimes(2);
  });
});
