import { renderHook } from '@testing-library/react';

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
} from '../lib/featureEvents';

import {
  useFeatureCoordinator,
} from './useFeatureCoordinator';

import {
  useWidgetStore,
} from '../store/widgetStore';

vi.mock('./useFeatureEvent', () => ({
  useFeatureEvent: vi.fn(),
}));

import {
  useFeatureEvent,
} from './useFeatureEvent';

describe('useFeatureCoordinator', () => {
  let handlers: Map<
    string,
    () => void
  >;

  beforeEach(() => {
    handlers = new Map();

    useWidgetStore.setState({
      activeWidgets: [],
    });

    vi.clearAllMocks();

    vi.mocked(
      useFeatureEvent,
    ).mockImplementation(
      ((
        eventName: string,
        handler: () => void,
      ) => {
        handlers.set(
          eventName,
          handler,
        );
      }) as typeof useFeatureEvent,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function emit(
    eventName: string,
  ): void {
    const handler =
      handlers.get(eventName);

    if (!handler) {
      throw new Error(
        `No handler registered for ${eventName}`,
      );
    }

    handler();
  }

  function expectActiveWidgets(
    widgets: string[],
  ): void {
    expect(
      useWidgetStore
        .getState()
        .activeWidgets,
    ).toEqual(widgets);
  }

  it('subscribes to all supported feature events', () => {
    renderHook(() =>
      useFeatureCoordinator(),
    );

    expect(
      useFeatureEvent,
    ).toHaveBeenCalledTimes(11);

    expect(
      handlers.has(
        FEATURE_EVENTS.MEDIA_AVAILABLE,
      ),
    ).toBe(true);

    expect(
      handlers.has(
        FEATURE_EVENTS.MEDIA_UNAVAILABLE,
      ),
    ).toBe(true);

    expect(
      handlers.has(
        FEATURE_EVENTS.MEDIA_STARTED,
      ),
    ).toBe(true);

    expect(
      handlers.has(
        FEATURE_EVENTS.MEDIA_PAUSED,
      ),
    ).toBe(true);

    expect(
      handlers.has(
        FEATURE_EVENTS.MEDIA_CHANGED,
      ),
    ).toBe(true);

    expect(
      handlers.has(
        FEATURE_EVENTS.FOCUS_TIMER_STARTED,
      ),
    ).toBe(true);

    expect(
      handlers.has(
        FEATURE_EVENTS.FOCUS_TIMER_PAUSED,
      ),
    ).toBe(true);

    expect(
      handlers.has(
        FEATURE_EVENTS.FOCUS_TIMER_COMPLETED,
      ),
    ).toBe(true);

    expect(
      handlers.has(
        FEATURE_EVENTS.FOCUS_TIMER_RESET,
      ),
    ).toBe(true);

    expect(
      handlers.has(
        FEATURE_EVENTS.TELEMETRY_WARNING,
      ),
    ).toBe(true);

    expect(
      handlers.has(
        FEATURE_EVENTS.TELEMETRY_NORMAL,
      ),
    ).toBe(true);
  });

  it('activates media when media becomes available', () => {
    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
    );

    expectActiveWidgets([
      'media',
    ]);
  });

  it('deactivates media when media becomes unavailable', () => {
    useWidgetStore.setState({
      activeWidgets: [
        'media',
        'focusTimer',
      ],
    });

    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.MEDIA_UNAVAILABLE,
    );

    expectActiveWidgets([
      'focusTimer',
    ]);
  });

  it('activates media when media.started occurs', () => {
    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.MEDIA_STARTED,
    );

    expectActiveWidgets([
      'media',
    ]);
  });

  it('activates focus timer when completed', () => {
    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.FOCUS_TIMER_COMPLETED,
    );

    expectActiveWidgets([
      'focusTimer',
    ]);
  });

  it('deactivates focus timer on reset', () => {
    useWidgetStore.setState({
      activeWidgets: [
        'media',
        'focusTimer',
      ],
    });

    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.FOCUS_TIMER_RESET,
    );

    expectActiveWidgets([
      'media',
    ]);
  });

  it('activates telemetry on warning', () => {
    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.TELEMETRY_WARNING,
    );

    expectActiveWidgets([
      'telemetry',
    ]);
  });

  it('deactivates telemetry when warning clears', () => {
    useWidgetStore.setState({
      activeWidgets: [
        'media',
        'telemetry',
      ],
    });

    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.TELEMETRY_NORMAL,
    );

    expectActiveWidgets([
      'media',
    ]);
  });

  it('does not duplicate an already active widget', () => {
    useWidgetStore.setState({
      activeWidgets: ['media'],
    });

    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
    );

    emit(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
    );

    expectActiveWidgets([
      'media',
    ]);
  });

  it('keeps media active when focus timer starts', () => {
    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
    );

    emit(
      FEATURE_EVENTS.FOCUS_TIMER_STARTED,
    );

    expectActiveWidgets([
      'media',
      'focusTimer',
    ]);
  });

  it('keeps both media and focus timer active when telemetry warning occurs', () => {
    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
    );

    emit(
      FEATURE_EVENTS.FOCUS_TIMER_STARTED,
    );

    emit(
      FEATURE_EVENTS.TELEMETRY_WARNING,
    );

    expectActiveWidgets([
      'media',
      'focusTimer',
      'telemetry',
    ]);
  });

  it('removes telemetry without disturbing media and focus timer', () => {
    useWidgetStore.setState({
      activeWidgets: [
        'media',
        'focusTimer',
        'telemetry',
      ],
    });

    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.TELEMETRY_NORMAL,
    );

    expectActiveWidgets([
      'media',
      'focusTimer',
    ]);
  });

  it('removes focus timer without disturbing media and telemetry', () => {
    useWidgetStore.setState({
      activeWidgets: [
        'media',
        'focusTimer',
        'telemetry',
      ],
    });

    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.FOCUS_TIMER_RESET,
    );

    expectActiveWidgets([
      'media',
      'telemetry',
    ]);
  });

  it('removes media without disturbing focus timer and telemetry', () => {
    useWidgetStore.setState({
      activeWidgets: [
        'media',
        'focusTimer',
        'telemetry',
      ],
    });

    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.MEDIA_UNAVAILABLE,
    );

    expectActiveWidgets([
      'focusTimer',
      'telemetry',
    ]);
  });

  it('handles a full multi-feature lifecycle', () => {
    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
    );

    expectActiveWidgets([
      'media',
    ]);

    emit(
      FEATURE_EVENTS.FOCUS_TIMER_STARTED,
    );

    expectActiveWidgets([
      'media',
      'focusTimer',
    ]);

    emit(
      FEATURE_EVENTS.TELEMETRY_WARNING,
    );

    expectActiveWidgets([
      'media',
      'focusTimer',
      'telemetry',
    ]);

    emit(
      FEATURE_EVENTS.TELEMETRY_NORMAL,
    );

    expectActiveWidgets([
      'media',
      'focusTimer',
    ]);

    emit(
      FEATURE_EVENTS.MEDIA_UNAVAILABLE,
    );

    expectActiveWidgets([
      'focusTimer',
    ]);

    emit(
      FEATURE_EVENTS.FOCUS_TIMER_RESET,
    );

    expectActiveWidgets([]);
  });

  it('handles feature activation in different event orders', () => {
    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.TELEMETRY_WARNING,
    );

    emit(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
    );

    emit(
      FEATURE_EVENTS.FOCUS_TIMER_STARTED,
    );

    expectActiveWidgets([
      'telemetry',
      'media',
      'focusTimer',
    ]);
  });

  it('ignores removal events for inactive widgets', () => {
    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.MEDIA_UNAVAILABLE,
    );

    emit(
      FEATURE_EVENTS.FOCUS_TIMER_RESET,
    );

    emit(
      FEATURE_EVENTS.TELEMETRY_NORMAL,
    );

    expectActiveWidgets([]);
  });

  it('does not duplicate widgets when multiple equivalent activation events fire', () => {
    renderHook(() =>
      useFeatureCoordinator(),
    );

    emit(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
    );

    emit(
      FEATURE_EVENTS.MEDIA_STARTED,
    );

    emit(
      FEATURE_EVENTS.MEDIA_STARTED,
    );

    expectActiveWidgets([
      'media',
    ]);
  });
});