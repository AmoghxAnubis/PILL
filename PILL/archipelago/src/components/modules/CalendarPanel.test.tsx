import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CalendarPanel } from './CalendarPanel';

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('calendar panel', () => {
  it('follows midnight and month rollover while viewing today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 31, 23, 59, 30));
    render(<CalendarPanel />);
    const october = new Date(2026, 9, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    expect(screen.getByRole('table', { name: october })).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(31_000); });
    const november = new Date(2026, 10, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    expect(screen.getByRole('table', { name: november })).toBeInTheDocument();
    expect(document.querySelector('[aria-current="date"]')).toHaveTextContent('1');
  });

  it('keeps a browsed month stable and returns to today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 31, 23, 59, 30));
    render(<CalendarPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    act(() => { vi.advanceTimersByTime(31_000); });
    const september = new Date(2026, 8, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    expect(screen.getByRole('table', { name: september })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(document.querySelector('[aria-current="date"]')).toHaveTextContent('1');
  });
});
