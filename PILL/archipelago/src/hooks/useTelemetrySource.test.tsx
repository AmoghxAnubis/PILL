import {
  act,
  cleanup,
  renderHook,
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
  clearFeatureEventListeners,
  subscribeToFeatureEvent,
} from '../lib/featureEvents';

import {
  TAURI_EVENTS,
  useTauriTypedEvent,
  type TelemetryUpdate,
} from '../lib/tauriEvents';

import {
  useTelemetryStore,
} from '../store/telemetryStore';

import {
  useTelemetrySource,
  TELEMETRY_WARNING_THRESHOLD,
} from './useTelemetrySource';

vi.mock('../lib/tauriEvents', async () => {
  const actual = await vi.importActual<
    typeof import('../lib/tauriEvents')
  >('../lib/tauriEvents');

  return {
    ...actual,
    useTauriTypedEvent: vi.fn(),
  };
});

const mockedUseTauriTypedEvent =
  vi.mocked(useTauriTypedEvent);

let telemetryHandler:
  | ((payload: TelemetryUpdate) => void)
  | undefined;

beforeEach(() => {
  telemetryHandler = undefined;

  clearFeatureEventListeners();

  useTelemetryStore.setState({
    cpu: 0,
    ram: 0,
  });

  mockedUseTauriTypedEvent.mockImplementation(
    (eventName, handler) => {
      if (
        eventName ===
        TAURI_EVENTS.TELEMETRY_UPDATE
      ) {
        telemetryHandler =
          handler as (
            payload: TelemetryUpdate,
          ) => void;
      }
    },
  );
});

afterEach(() => {
  cleanup();
  clearFeatureEventListeners();
  vi.clearAllMocks();
});

function emitTelemetry(
  payload: TelemetryUpdate,
): void {
  if (!telemetryHandler) {
    throw new Error(
      'Telemetry update handler was not registered',
    );
  }

  act(() => {
    telemetryHandler?.(payload);
  });
}

describe('useTelemetrySource', () => {
  it('subscribes to telemetry updates', () => {
    renderHook(() =>
      useTelemetrySource(),
    );

    expect(
      mockedUseTauriTypedEvent,
    ).toHaveBeenCalledWith(
      TAURI_EVENTS.TELEMETRY_UPDATE,
      expect.any(Function),
    );
  });

  it('updates the telemetry store', () => {
    renderHook(() =>
      useTelemetrySource(),
    );

    emitTelemetry({
      cpu: 42,
      ram: 57,
    });

    const state =
      useTelemetryStore.getState();

    expect(state.cpu).toBe(42);
    expect(state.ram).toBe(57);
  });

  it('enters warning at the CPU threshold', () => {
    renderHook(() =>
      useTelemetrySource(),
    );

    const handler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.TELEMETRY_WARNING,
      handler,
    );

    emitTelemetry({
      cpu:
        TELEMETRY_WARNING_THRESHOLD,
      ram: 40,
    });

    expect(handler).toHaveBeenCalledTimes(1);

    expect(handler).toHaveBeenCalledWith({
      cpu_usage:
        TELEMETRY_WARNING_THRESHOLD,
      ram_percentage: 40,
    });
  });

  it('enters warning at the RAM threshold', () => {
    renderHook(() =>
      useTelemetrySource(),
    );

    const handler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.TELEMETRY_WARNING,
      handler,
    );

    emitTelemetry({
      cpu: 40,
      ram:
        TELEMETRY_WARNING_THRESHOLD,
    });

    expect(handler).toHaveBeenCalledTimes(1);

    expect(handler).toHaveBeenCalledWith({
      cpu_usage: 40,
      ram_percentage:
        TELEMETRY_WARNING_THRESHOLD,
    });
  });

  it('does not warn below the threshold', () => {
    renderHook(() =>
      useTelemetrySource(),
    );

    const handler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.TELEMETRY_WARNING,
      handler,
    );

    emitTelemetry({
      cpu:
        TELEMETRY_WARNING_THRESHOLD - 0.1,
      ram:
        TELEMETRY_WARNING_THRESHOLD - 0.1,
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not repeatedly emit warnings while remaining above the threshold', () => {
    renderHook(() =>
      useTelemetrySource(),
    );

    const handler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.TELEMETRY_WARNING,
      handler,
    );

    emitTelemetry({
      cpu: 90,
      ram: 50,
    });

    emitTelemetry({
      cpu: 92,
      ram: 55,
    });

    emitTelemetry({
      cpu: 95,
      ram: 60,
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('emits normal after leaving warning state', () => {
    renderHook(() =>
      useTelemetrySource(),
    );

    const handler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.TELEMETRY_NORMAL,
      handler,
    );

    emitTelemetry({
      cpu: 90,
      ram: 50,
    });

    emitTelemetry({
      cpu: 70,
      ram: 60,
    });

    expect(handler).toHaveBeenCalledTimes(1);

    expect(handler).toHaveBeenCalledWith({
      cpu_usage: 70,
      ram_percentage: 60,
    });
  });

  it('can emit another warning after leaving and re-entering warning state', () => {
    renderHook(() =>
      useTelemetrySource(),
    );

    const handler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.TELEMETRY_WARNING,
      handler,
    );

    emitTelemetry({
      cpu: 90,
      ram: 50,
    });

    emitTelemetry({
      cpu: 70,
      ram: 60,
    });

    emitTelemetry({
      cpu: 88,
      ram: 61,
    });

    expect(handler).toHaveBeenCalledTimes(2);

    expect(
      handler,
    ).toHaveBeenNthCalledWith(1, {
      cpu_usage: 90,
      ram_percentage: 50,
    });

    expect(
      handler,
    ).toHaveBeenNthCalledWith(2, {
      cpu_usage: 88,
      ram_percentage: 61,
    });
  });
});