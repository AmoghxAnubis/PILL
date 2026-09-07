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
  vi,
} from 'vitest';

import { SplitState } from './SplitState';

vi.mock('../../hooks/useMedia', () => ({
  useMedia: vi.fn(),
}));

vi.mock('../widgets/FocusTimer', () => ({
  FocusTimer: () => (
    <div data-testid="focus-timer">
      Focus Timer
    </div>
  ),
}));

vi.mock('../widgets/GlanceMetrics', () => ({
  GlanceMetrics: () => (
    <div data-testid="glance-metrics">
      Telemetry
    </div>
  ),
}));

import { useMedia } from '../../hooks/useMedia';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  vi.mocked(useMedia).mockReturnValue({
    media: {
      app_id: 'test-app',
      title: 'Test Track',
      artist: 'Test Artist',
      is_playing: true,
      duration: 240,
      position: 60,
      artwork: null,
    },
    hasMedia: true,
  });
});

describe('SplitState', () => {
  it('renders focus timer as the primary widget', () => {
    render(
      <SplitState
        widgetOrchestration={{
          layout: 'split',
          primary: 'focusTimer',
          secondary: 'media',
        }}
      />,
    );

    expect(
      screen.getByTestId('focus-timer'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Test Track'),
    ).toBeInTheDocument();
  });

  it('renders media as the primary widget', () => {
    render(
      <SplitState
        widgetOrchestration={{
          layout: 'split',
          primary: 'media',
          secondary: 'telemetry',
        }}
      />,
    );

    expect(
      screen.getByText('Test Track'),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId('glance-metrics'),
    ).toBeInTheDocument();
  });

  it('renders telemetry as the primary widget', () => {
    render(
      <SplitState
        widgetOrchestration={{
          layout: 'split',
          primary: 'telemetry',
          secondary: 'media',
        }}
      />,
    );

    const telemetry =
      screen.getAllByTestId('glance-metrics');

    expect(telemetry.length).toBeGreaterThan(0);

    expect(
      screen.getByText('Test Track'),
    ).toBeInTheDocument();
  });

  it('renders no secondary widget when none is provided', () => {
    render(
      <SplitState
        widgetOrchestration={{
          layout: 'split',
          primary: 'focusTimer',
          secondary: null,
        }}
      />,
    );

    expect(
      screen.getByTestId('focus-timer'),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText('No secondary widget'),
    ).toBeInTheDocument();
  });

  it('exposes the orchestration layout and widget IDs', () => {
    render(
      <SplitState
        widgetOrchestration={{
          layout: 'split',
          primary: 'focusTimer',
          secondary: 'media',
        }}
      />,
    );

    const splitState =
      document.querySelector('.state-split');

    expect(splitState).toHaveAttribute(
      'data-layout',
      'split',
    );

    expect(splitState).toHaveAttribute(
      'data-primary',
      'focusTimer',
    );

    expect(splitState).toHaveAttribute(
      'data-secondary',
      'media',
    );
  });

  it('falls back safely when orchestration is omitted', () => {
    render(<SplitState />);

    const splitState =
      document.querySelector('.state-split');

    expect(splitState).toHaveAttribute(
      'data-layout',
      'none',
    );

    expect(splitState).toHaveAttribute(
      'data-primary',
      'none',
    );

    expect(splitState).toHaveAttribute(
      'data-secondary',
      'none',
    );
  });
});