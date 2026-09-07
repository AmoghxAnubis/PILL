/**
 * GlanceMetrics — Live system telemetry shown in CompactState.
 * Receives CPU and RAM updates from the Rust telemetry monitor.
 */

import { useRef, useState } from 'react';

import {
  FEATURE_EVENTS,
  emitFeatureEvent,
} from '../../lib/featureEvents';

import {
  TAURI_EVENTS,
  useTauriTypedEvent,
  type TelemetryUpdate,
} from '../../lib/tauriEvents';

interface GlanceMetricsState {
  cpu: number;
  ram: number;
}

const TELEMETRY_WARNING_THRESHOLD = 85;

function isTelemetryWarning(
  cpu: number,
  ram: number,
): boolean {
  return (
    cpu >= TELEMETRY_WARNING_THRESHOLD ||
    ram >= TELEMETRY_WARNING_THRESHOLD
  );
}

export function GlanceMetrics() {
  const [metrics, setMetrics] =
    useState<GlanceMetricsState>({
      cpu: 0,
      ram: 0,
    });

  const warningStateRef = useRef(false);

  useTauriTypedEvent(
    TAURI_EVENTS.TELEMETRY_UPDATE,
    (payload: TelemetryUpdate) => {
      const nextWarningState =
        isTelemetryWarning(
          payload.cpu_usage,
          payload.ram_percentage,
        );

      const previousWarningState =
        warningStateRef.current;

      if (
        nextWarningState &&
        !previousWarningState
      ) {
        emitFeatureEvent(
          FEATURE_EVENTS.TELEMETRY_WARNING,
          {
            cpu_usage: payload.cpu_usage,
            ram_percentage:
              payload.ram_percentage,
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
            cpu_usage: payload.cpu_usage,
            ram_percentage:
              payload.ram_percentage,
          },
        );
      }

      warningStateRef.current =
        nextWarningState;

      setMetrics({
        cpu: payload.cpu_usage,
        ram: payload.ram_percentage,
      });
    },
  );

  const isWarning =
    metrics.cpu >=
      TELEMETRY_WARNING_THRESHOLD ||
    metrics.ram >=
      TELEMETRY_WARNING_THRESHOLD;

  return (
    <div
      className={`glance-metrics${
        isWarning
          ? ' glance-metrics--warning'
          : ''
      }`}
      aria-label="System telemetry"
      data-warning={isWarning}
    >
      <span className="glance-metrics__item">
        CPU {Math.round(metrics.cpu)}%
      </span>

      <span className="glance-metrics__separator">
        •
      </span>

      <span className="glance-metrics__item">
        RAM {Math.round(metrics.ram)}%
      </span>
    </div>
  );
}