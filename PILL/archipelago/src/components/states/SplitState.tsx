/**
 * SplitState — Used when multiple concurrent events are active.
 * Stacks widgets side-by-side or in a primary+badge layout.
 * Will be fully implemented once multiple features exist.
 */
export function SplitState() {
  return (
    <div className="state-split">
      <div className="state-split__primary">
        <span>Primary</span>
      </div>
      <div className="state-split__badge">
        <span>•</span>
      </div>
    </div>
  );
}
