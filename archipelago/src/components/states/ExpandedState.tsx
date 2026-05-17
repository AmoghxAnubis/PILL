interface ExpandedStateProps {
  onCollapse: () => void;
}

/**
 * ExpandedState — The full dashboard view of the island.
 * Shows detailed controls and information.
 * Placeholder content for Phase 1 — will house media controls,
 * telemetry dashboards, etc. in later phases.
 */
export function ExpandedState({ onCollapse }: ExpandedStateProps) {
  return (
    <div className="state-expanded">
      <div className="state-expanded__header">
        <span className="state-expanded__title">Archipelago</span>
        <button
          className="state-expanded__close"
          onClick={(e) => {
            e.stopPropagation();
            onCollapse();
          }}
          aria-label="Collapse island"
        >
          ✕
        </button>
      </div>
      <div className="state-expanded__body">
        <p className="state-expanded__placeholder">
          System widgets will appear here
        </p>
      </div>
    </div>
  );
}
