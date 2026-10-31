import { describe, expect, it } from 'vitest';
import { calendarMonth } from './calendar';

describe('local calendar month', () => {
  it('includes leap day and pads complete Monday-first weeks', () => {
    const days = calendarMonth(2024, 1, new Date(2024, 1, 29, 23));
    expect(days.filter((day) => day.inMonth)).toHaveLength(29);
    expect(days[0].date.getDay()).toBe(1);
    expect(days[days.length - 1].date.getDay()).toBe(0);
    expect(days.find((day) => day.isToday)?.date.getDate()).toBe(29);
    expect(days.length % 7).toBe(0);
  });

  it('renders six weeks where needed without dropping dates', () => {
    const days = calendarMonth(2026, 2, new Date(2026, 2, 1));
    expect(days).toHaveLength(42);
    expect(days.filter((day) => day.inMonth)).toHaveLength(31);
    expect(new Set(days.map((day) => day.key)).size).toBe(42);
  });

  it('uses local dates across a year boundary', () => {
    const days = calendarMonth(2027, 0, new Date(2026, 11, 31, 23, 59));
    const today = days.find((day) => day.isToday);
    expect(today?.inMonth).toBe(false);
    expect(today?.date.getFullYear()).toBe(2026);
    expect(days.filter((day) => day.inMonth)).toHaveLength(31);
  });
});
