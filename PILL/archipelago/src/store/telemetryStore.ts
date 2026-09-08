import { create } from 'zustand';

interface TelemetryStore {
  cpu: number;
  ram: number;

  setTelemetry: (
    cpu: number,
    ram: number,
  ) => void;

  clearTelemetry: () => void;
}

export const useTelemetryStore =
  create<TelemetryStore>((set) => ({
    cpu: 0,
    ram: 0,

    setTelemetry: (cpu, ram) => {
      set({
        cpu,
        ram,
      });
    },

    clearTelemetry: () => {
      set({
        cpu: 0,
        ram: 0,
      });
    },
  }));