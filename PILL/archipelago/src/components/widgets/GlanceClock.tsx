import { useClock } from '../../hooks/useClock';

/** A useful second slot for collapsed views, updated on minute boundaries. */
export function GlanceClock() {
  const now = useClock();
  return (
    <div className="glance-clock" aria-label="Local time">
      <time dateTime={now.toISOString()}>
        {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
      </time>
      <span>{now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
    </div>
  );
}
