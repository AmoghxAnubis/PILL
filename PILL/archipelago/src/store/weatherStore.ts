import { create } from 'zustand';
import type { WeatherSnapshot } from '../../../shared/weather/types';

interface WeatherStore {
  status: 'disabled' | 'unconfigured' | 'loading' | 'ready' | 'stale' | 'error';
  data: WeatherSnapshot | null;
  error: string | null;
  refreshing: boolean;
  refreshVersion: number;
  lastAttempt: number;
  refresh: () => void;
}
export const useWeatherStore = create<WeatherStore>((set, get) => ({
  status: 'disabled', data: null, error: null, refreshing: false, refreshVersion: 0, lastAttempt: 0,
  refresh: () => {
    if (get().refreshing || Date.now() - get().lastAttempt < 60_000) return;
    set((state) => ({ refreshVersion: state.refreshVersion + 1 }));
  },
}));
