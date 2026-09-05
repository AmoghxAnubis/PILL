/**
 * CompactState — The hover/glance state of the island.
 * Shows the island identity alongside live telemetry metrics.
 */

import { GlanceMetrics } from '../widgets/GlanceMetrics';

export function CompactState() {
  return (
    <div className="state-compact">
      <div className="state-compact__indicator">
        <div className="state-compact__dot state-compact__dot--active" />
      </div>

      <span className="state-compact__label">Archipelago</span>

      <GlanceMetrics />
    </div>
  );
}