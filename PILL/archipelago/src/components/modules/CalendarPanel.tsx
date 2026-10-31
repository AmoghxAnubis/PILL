import { useState } from 'react';
import { useClock } from '../../hooks/useClock';
import { calendarMonth } from '../../lib/calendar';

export function CalendarPanel() {
  const now = useClock();
  // A null offset follows today through month rollover until the user browses.
  const [browsing, setBrowsing] = useState<Date | null>(null);
  const month = browsing ?? now;
  const monthLabel = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const days = calendarMonth(month.getFullYear(), month.getMonth(), now);
  const move = (offset: number) => setBrowsing(new Date(month.getFullYear(), month.getMonth() + offset, 1, 12));

  return (
    <section className="calendar-panel" aria-label="Calendar">
      <div className="calendar-panel__today">
        <p>{now.toLocaleDateString(undefined, { weekday: 'long' })}</p>
        <strong>{now.getDate()}</strong>
        <time dateTime={now.toISOString()}>{now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</time>
        <button type="button" onClick={() => setBrowsing(null)}>Today</button>
      </div>
      <div className="calendar-panel__month">
        <div className="calendar-panel__navigation">
          <h2 aria-live="polite">{monthLabel}</h2>
          <button type="button" aria-label="Previous month" onClick={() => move(-1)}>‹</button>
          <button type="button" aria-label="Next month" onClick={() => move(1)}>›</button>
        </div>
        <div className="calendar-panel__grid" role="table" aria-label={monthLabel}>
          <div role="row" className="calendar-panel__week">
            {Array.from({ length: 7 }, (_, i) => {
              const day = new Date(2024, 0, 1 + i, 12); // a known Monday
              return <span role="columnheader" key={i} title={day.toLocaleDateString(undefined, { weekday: 'long' })}>{day.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>;
            })}
          </div>
          {Array.from({ length: days.length / 7 }, (_, week) => (
            <div role="row" className="calendar-panel__week" key={week}>
              {days.slice(week * 7, week * 7 + 7).map((day) => (
                <span role="cell" key={day.key} aria-current={day.isToday ? 'date' : undefined} aria-label={day.date.toLocaleDateString(undefined, { dateStyle: 'full' })} className={`${day.inMonth ? '' : 'calendar-day--outside'} ${day.isToday ? 'calendar-day--today' : ''}`}>{day.date.getDate()}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
