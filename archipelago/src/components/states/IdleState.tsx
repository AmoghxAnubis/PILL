/**
 * IdleState — The minimal resting state of the island.
 * Shows a subtle dot indicator to hint at interactivity.
 */
export function IdleState() {
  return (
    <div className="state-idle">
      <div className="state-idle__dot" />
    </div>
  );
}
