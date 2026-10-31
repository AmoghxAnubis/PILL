import { useClock } from '../../hooks/useClock';

export function IdleState() {
  const now = useClock();
  return (
    <div className="state-idle">
      <span className="idle-clock__dot" aria-hidden="true" />
      <time dateTime={now.toISOString()} className="idle-clock__time">
        {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
      </time>
      <span className="idle-clock__date">{now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
    </div>
  );
}
