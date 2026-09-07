import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FocusTimer } from './FocusTimer';
import { useFocusTimer } from '../../hooks/useFocusTimer';

vi.mock('../../hooks/useFocusTimer', () => ({
  useFocusTimer: vi.fn(),
}));

const mockedUseFocusTimer = vi.mocked(useFocusTimer);

afterEach(() => {
  vi.clearAllMocks();
});

describe('FocusTimer', () => {
  it('renders the remaining time', () => {
    mockedUseFocusTimer.mockReturnValue({
      secondsRemaining: 25 * 60,
      isRunning: false,
      status: 'idle',
      start: vi.fn(),
      pause: vi.fn(),
      reset: vi.fn(),
    });

    render(<FocusTimer />);

    expect(
      screen.getByText('25:00'),
    ).toBeInTheDocument();
  });

  it('shows start control when stopped', () => {
    mockedUseFocusTimer.mockReturnValue({
      secondsRemaining: 1500,
      isRunning: false,
      status: 'idle',
      start: vi.fn(),
      pause: vi.fn(),
      reset: vi.fn(),
    });

    render(<FocusTimer />);

    expect(
      screen.getByRole('button', {
        name: 'Start focus timer',
      }),
    ).toBeInTheDocument();
  });

  it('shows pause control when running', () => {
    mockedUseFocusTimer.mockReturnValue({
      secondsRemaining: 1499,
      isRunning: true,
      status: 'running',
      start: vi.fn(),
      pause: vi.fn(),
      reset: vi.fn(),
    });

    render(<FocusTimer />);

    expect(
      screen.getByRole('button', {
        name: 'Pause focus timer',
      }),
    ).toBeInTheDocument();
  });

  it('starts the timer when start is clicked', async () => {
    const start = vi.fn();

    mockedUseFocusTimer.mockReturnValue({
      secondsRemaining: 1500,
      isRunning: false,
      status: 'idle',
      start,
      pause: vi.fn(),
      reset: vi.fn(),
    });

    render(<FocusTimer />);

    await act(async () => {
      screen
        .getByRole('button', {
          name: 'Start focus timer',
        })
        .click();
    });

    expect(start).toHaveBeenCalledTimes(1);
  });

  it('pauses the timer when pause is clicked', async () => {
    const pause = vi.fn();

    mockedUseFocusTimer.mockReturnValue({
      secondsRemaining: 1499,
      isRunning: true,
      status: 'running',
      start: vi.fn(),
      pause,
      reset: vi.fn(),
    });

    render(<FocusTimer />);

    await act(async () => {
      screen
        .getByRole('button', {
          name: 'Pause focus timer',
        })
        .click();
    });

    expect(pause).toHaveBeenCalledTimes(1);
  });

  it('resets the timer', async () => {
    const reset = vi.fn();

    mockedUseFocusTimer.mockReturnValue({
      secondsRemaining: 1200,
      isRunning: true,
      status: 'running',
      start: vi.fn(),
      pause: vi.fn(),
      reset,
    });

    render(<FocusTimer />);

    await act(async () => {
      screen
        .getByRole('button', {
          name: 'Reset focus timer',
        })
        .click();
    });

    expect(reset).toHaveBeenCalledTimes(1);
  });
});