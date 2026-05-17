/**
 * CompactState — The hover/glance state of the island.
 * Shows a brief summary of active system info.
 * Placeholder content for Phase 1 — will be populated with
 * real widgets (volume, media, telemetry) in later phases.
 */
export function CompactState() {
  return (
    <div className="state-compact">
      <div className="state-compact__indicator">
        <div className="state-compact__dot state-compact__dot--active" />
      </div>
      <span className="state-compact__label">Archipelago</span>
    </div>
  );
}
