import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { useTelemetryStore } from './telemetryStore';

beforeEach(() => {
  useTelemetryStore.setState({
    cpu: 0,
    ram: 0,
  });
});

describe('telemetryStore', () => {
  it('starts with zero telemetry', () => {
    const state =
      useTelemetryStore.getState();

    expect(state.cpu).toBe(0);
    expect(state.ram).toBe(0);
  });

  it('stores telemetry values', () => {
    useTelemetryStore
      .getState()
      .setTelemetry(42, 57);

    const state =
      useTelemetryStore.getState();

    expect(state.cpu).toBe(42);
    expect(state.ram).toBe(57);
  });

  it('clears telemetry', () => {
    useTelemetryStore
      .getState()
      .setTelemetry(90, 95);

    useTelemetryStore
      .getState()
      .clearTelemetry();

    const state =
      useTelemetryStore.getState();

    expect(state.cpu).toBe(0);
    expect(state.ram).toBe(0);
  });
});