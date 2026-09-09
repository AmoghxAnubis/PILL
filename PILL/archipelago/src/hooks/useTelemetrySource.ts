import { useRef } from 'react';

import {
  FEATURE_EVENTS,
  emitFeatureEvent,
} from '../lib/featureEvents';

import {
  TAURI_EVENTS,
  useTauriTypedEvent,
  type TelemetryUpdate,
} from '../lib/tauriEvents';

import { useTelemetryStore } from '../store/telemetryStore';

export const TELEMETRY_WARNING_THRESHOLD =
  85;

function isTelemetryWarning(
  cpu: number,
  ram: number,
): boolean {
  return (
    cpu >= TELEMETRY_WARNING_THRESHOLD ||
    ram >= TELEMETRY_WARNING_THRESHOLD
  );
}

export function useTelemetrySource(): void {
  const setTelemetry =
    useTelemetryStore(
      (state) => state.setTelemetry,
    );

  const warningStateRef = useRef(false);

  useTauriTypedEvent(
    TAURI_EVENTS.TELEMETRY_UPDATE,
    (payload: TelemetryUpdate) => {
      const cpu = payload.cpu;
      const ram = payload.ram;

      const nextWarningState =
        isTelemetryWarning(cpu, ram);

      const previousWarningState =
        warningStateRef.current;

      if (
        nextWarningState &&
        !previousWarningState
      ) {
        emitFeatureEvent(
          FEATURE_EVENTS.TELEMETRY_WARNING,
          {
            cpu_usage: cpu,
            ram_percentage: ram,
          },
        );
      }

      if (
        !nextWarningState &&
        previousWarningState
      ) {
        emitFeatureEvent(
          FEATURE_EVENTS.TELEMETRY_NORMAL,
          {
            cpu_usage: cpu,
            ram_percentage: ram,
          },
        );
      }

      warningStateRef.current =
        nextWarningState;

      setTelemetry(cpu, ram);
    },
  );
}