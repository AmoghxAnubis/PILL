export interface CalendarDay {
  key: string;
  date: Date;
  inMonth: boolean;
  isToday: boolean;
}

// Local date components deliberately avoid UTC/ISO conversion near midnight.
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function calendarMonth(year: number, month: number, today: Date): CalendarDay[] {
  const first = new Date(year, month, 1, 12);
  const count = new Date(year, month + 1, 0, 12).getDate();
  const leading = (first.getDay() + 6) % 7; // Monday first
  const cells = Math.ceil((leading + count) / 7) * 7;
  return Array.from({ length: cells }, (_, index) => {
    // Noon keeps date arithmetic out of daylight-saving midnight transitions.
    const date = new Date(year, month, index - leading + 1, 12);
    return {
      key: [date.getFullYear(), date.getMonth(), date.getDate()].join('-'),
      date, inMonth: date.getMonth() === first.getMonth(), isToday: isSameDay(date, today),
    };
  });
}
