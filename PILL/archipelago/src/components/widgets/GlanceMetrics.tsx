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

  return (
    <div className="glance-metrics" aria-label="System telemetry">
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