import { create } from 'zustand';

interface TelemetryStore {
  cpu: number;
  ram: number;
  hasSample: boolean;

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
    hasSample: false,

    setTelemetry: (cpu, ram) => {
      set({
        cpu,
        ram,
        hasSample: true,
      });
    },

    clearTelemetry: () => {
      set({
        cpu: 0,
        ram: 0,
        hasSample: false,
      });
    },
  }));
