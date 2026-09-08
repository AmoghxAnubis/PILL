import {
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
} from 'vitest';

import { GlanceMetrics } from './GlanceMetrics';

import {
  useTelemetryStore,
} from '../../store/telemetryStore';

describe('GlanceMetrics', () => {
  beforeEach(() => {
    useTelemetryStore.setState({
      cpu: 0,
      ram: 0,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('starts with zero telemetry', () => {
    render(<GlanceMetrics />);

    const telemetry =
      screen.getByLabelText(
        'System telemetry',
      );

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

  it('renders telemetry from the store', () => {
    useTelemetryStore
      .getState()
      .setTelemetry(42, 57);

    render(<GlanceMetrics />);

    expect(
      screen.getByText('CPU 42%'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('RAM 57%'),
    ).toBeInTheDocument();
  });

  it('shows warning when CPU reaches the threshold', () => {
    useTelemetryStore
      .getState()
      .setTelemetry(85, 40);

    render(<GlanceMetrics />);

    const telemetry =
      screen.getByLabelText(
        'System telemetry',
      );

    expect(telemetry).toHaveAttribute(
      'data-warning',
      'true',
    );
  });

  it('shows warning when RAM reaches the threshold', () => {
    useTelemetryStore
      .getState()
      .setTelemetry(40, 85);

    render(<GlanceMetrics />);

    const telemetry =
      screen.getByLabelText(
        'System telemetry',
      );

    expect(telemetry).toHaveAttribute(
      'data-warning',
      'true',
    );
  });

  it('does not show warning below the threshold', () => {
    useTelemetryStore
      .getState()
      .setTelemetry(84.9, 84.9);

    render(<GlanceMetrics />);

    const telemetry =
      screen.getByLabelText(
        'System telemetry',
      );

    expect(telemetry).toHaveAttribute(
      'data-warning',
      'false',
    );
  });
});