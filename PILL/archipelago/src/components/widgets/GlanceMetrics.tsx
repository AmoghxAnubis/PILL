/**
 * GlanceMetrics — Live system telemetry shown in CompactState.
 * Receives CPU and RAM updates from the Rust telemetry monitor.
 */

import { useState } from 'react';
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

export function GlanceMetrics() {
  const [metrics, setMetrics] = useState<GlanceMetricsState>({
    cpu: 0,
    ram: 0,
  });

  useTauriTypedEvent(
    TAURI_EVENTS.TELEMETRY_UPDATE,
    (payload: TelemetryUpdate) => {
      setMetrics({
        cpu: payload.cpu_usage,
        ram: payload.ram_percentage,
      });
    },
  );

  const isWarning =
    metrics.cpu >= TELEMETRY_WARNING_THRESHOLD ||
    metrics.ram >= TELEMETRY_WARNING_THRESHOLD;

  return (
    <div
      className={`glance-metrics${isWarning ? ' glance-metrics--warning' : ''}`}
      aria-label="System telemetry"
      data-warning={isWarning}
    >
      <span className="glance-metrics__item">
        CPU {Math.round(metrics.cpu)}%
      </span>

      <span className="glance-metrics__separator">•</span>

      <span className="glance-metrics__item">
        RAM {Math.round(metrics.ram)}%
      </span>
    </div>
  );
}