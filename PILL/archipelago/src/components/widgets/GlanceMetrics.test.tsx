import {
  act,
  cleanup,
  render,
  screen,
} from '@testing-library/react';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  FEATURE_EVENTS,
  subscribeToFeatureEvent,
} from '../../lib/featureEvents';

import { GlanceMetrics } from './GlanceMetrics';

const listeners = new Map<
  string,
  (payload: unknown) => void
>();

vi.mock('../../lib/tauriEvents', async () => {
  const actual = await vi.importActual<
    typeof import('../../lib/tauriEvents')
  >('../../lib/tauriEvents');

  return {
    ...actual,
    useTauriTypedEvent: vi.fn(
      (
        eventName: string,
        handler: (payload: unknown) => void,
      ) => {
        listeners.set(eventName, handler);
      },
    ),
  };
});

describe('GlanceMetrics', () => {
  beforeEach(() => {
    listeners.clear();
  });

  afterEach(() => {
    cleanup();
    listeners.clear();
    vi.clearAllMocks();
  });

  it('starts with zero telemetry', () => {
    render(<GlanceMetrics />);

    const telemetry =
      screen.getByLabelText('System telemetry');

    expect(
      screen.getByText('CPU 0%'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('RAM 0%'),
    ).toBeInTheDocument();

    expect(telemetry).toHaveAttribute(
      'data-warning',
      'false',
    );
  });

  it('updates from telemetry events', () => {
    render(<GlanceMetrics />);

    const handler =
      listeners.get('telemetry_update');

    expect(handler).toBeDefined();

    act(() => {
      handler?.({
        cpu_usage: 42,
        ram_percentage: 57,
      });
    });

    expect(
      screen.getByText('CPU 42%'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('RAM 57%'),
    ).toBeInTheDocument();
  });

  it('enters warning state at the CPU threshold', () => {
    render(<GlanceMetrics />);

    const handler =
      listeners.get('telemetry_update');

    expect(handler).toBeDefined();

    act(() => {
      handler?.({
        cpu_usage: 85,
        ram_percentage: 40,
      });
    });

    const telemetry =
      screen.getByLabelText('System telemetry');

    expect(telemetry).toHaveAttribute(
      'data-warning',
      'true',
    );
  });

  it('enters warning state at the RAM threshold', () => {
    render(<GlanceMetrics />);

    const handler =
      listeners.get('telemetry_update');

    expect(handler).toBeDefined();

    act(() => {
      handler?.({
        cpu_usage: 40,
        ram_percentage: 85,
      });
    });

    const telemetry =
      screen.getByLabelText('System telemetry');

    expect(telemetry).toHaveAttribute(
      'data-warning',
      'true',
    );
  });

  it('does not enter warning state below the threshold', () => {
    render(<GlanceMetrics />);

    const handler =
      listeners.get('telemetry_update');

    expect(handler).toBeDefined();

    act(() => {
      handler?.({
        cpu_usage: 84.9,
        ram_percentage: 84.9,
      });
    });

    const telemetry =
      screen.getByLabelText('System telemetry');

    expect(telemetry).toHaveAttribute(
      'data-warning',
      'false',
    );
  });

  it('emits telemetry.warning when entering the warning state', () => {
    const warningHandler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.TELEMETRY_WARNING,
        warningHandler,
      );

    render(<GlanceMetrics />);

    const telemetryHandler =
      listeners.get('telemetry_update');

    expect(telemetryHandler).toBeDefined();

    act(() => {
      telemetryHandler?.({
        cpu_usage: 91,
        ram_percentage: 62,
      });
    });

    expect(
      warningHandler,
    ).toHaveBeenCalledTimes(1);

    expect(
      warningHandler,
    ).toHaveBeenCalledWith({
      cpu_usage: 91,
      ram_percentage: 62,
    });

    unsubscribe();
  });

  it('does not repeatedly emit warnings while still above the threshold', () => {
    const warningHandler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.TELEMETRY_WARNING,
        warningHandler,
      );

    render(<GlanceMetrics />);

    const telemetryHandler =
      listeners.get('telemetry_update');

    expect(telemetryHandler).toBeDefined();

    act(() => {
      telemetryHandler?.({
        cpu_usage: 90,
        ram_percentage: 50,
      });
    });

    act(() => {
      telemetryHandler?.({
        cpu_usage: 92,
        ram_percentage: 55,
      });
    });

    act(() => {
      telemetryHandler?.({
        cpu_usage: 95,
        ram_percentage: 60,
      });
    });

    expect(
      warningHandler,
    ).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('emits another warning after leaving and re-entering the warning state', () => {
    const warningHandler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.TELEMETRY_WARNING,
        warningHandler,
      );

    render(<GlanceMetrics />);

    const telemetryHandler =
      listeners.get('telemetry_update');

    expect(telemetryHandler).toBeDefined();

    act(() => {
      telemetryHandler?.({
        cpu_usage: 90,
        ram_percentage: 50,
      });
    });

    act(() => {
      telemetryHandler?.({
        cpu_usage: 70,
        ram_percentage: 60,
      });
    });

    act(() => {
      telemetryHandler?.({
        cpu_usage: 88,
        ram_percentage: 61,
      });
    });

    expect(
      warningHandler,
    ).toHaveBeenCalledTimes(2);

    expect(
      warningHandler,
    ).toHaveBeenNthCalledWith(
      1,
      {
        cpu_usage: 90,
        ram_percentage: 50,
      },
    );

    expect(
      warningHandler,
    ).toHaveBeenNthCalledWith(
      2,
      {
        cpu_usage: 88,
        ram_percentage: 61,
      },
    );

    unsubscribe();
  });
});