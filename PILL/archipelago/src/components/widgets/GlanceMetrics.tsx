/**
 * GlanceMetrics — Live system telemetry shown in CompactState.
 * Reads CPU and RAM telemetry from the telemetry store.
 */

import { useTelemetryStore } from '../../store/telemetryStore';

import {
  TELEMETRY_WARNING_THRESHOLD,
} from '../../hooks/useTelemetrySource';

export function GlanceMetrics() {
  const cpu = useTelemetryStore(
    (state) => state.cpu,
  );

  const ram = useTelemetryStore(
    (state) => state.ram,
  );

  const isWarning =
    cpu >= TELEMETRY_WARNING_THRESHOLD ||
    ram >= TELEMETRY_WARNING_THRESHOLD;

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
        CPU {Math.round(cpu)}%
      </span>

      <span className="glance-metrics__separator">
        •
      </span>

      <span className="glance-metrics__item">
        RAM {Math.round(ram)}%
      </span>
    </div>
  );
}