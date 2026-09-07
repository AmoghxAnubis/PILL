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

import { useFeatureCoordinator } from './useFeatureCoordinator';

import {
  useWidgetStore,
} from '../store/widgetStore';

vi.mock('./useFeatureEvent', () => ({
  useFeatureEvent: vi.fn(),
}));

import { useFeatureEvent } from './useFeatureEvent';

describe('useFeatureCoordinator', () => {
  let handlers = new Map<
    string,
    () => void
  >();

  beforeEach(() => {
    handlers = new Map();

    useWidgetStore.setState({
      activeWidgets: [],
    });

    vi.clearAllMocks();

    vi.mocked(useFeatureEvent).mockImplementation(
      ((eventName: string, handler: () => void) => {
        handlers.set(eventName, handler);
      }) as typeof useFeatureEvent,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('subscribes to all supported feature events', () => {
    renderHook(() =>
      useFeatureCoordinator(),
    );

    expect(
      useFeatureEvent,
    ).toHaveBeenCalledTimes(8);

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
  });

  it('activates media when media.started occurs', () => {
    renderHook(() =>
      useFeatureCoordinator(),
    );

    handlers
      .get(FEATURE_EVENTS.MEDIA_STARTED)
      ?.();

    expect(
      useWidgetStore
        .getState()
        .activeWidgets,
    ).toEqual(['media']);
  });

  it('activates focus timer when completed', () => {
    renderHook(() =>
      useFeatureCoordinator(),
    );

    handlers
      .get(
        FEATURE_EVENTS.FOCUS_TIMER_COMPLETED,
      )
      ?.();

    expect(
      useWidgetStore
        .getState()
        .activeWidgets,
    ).toEqual(['focusTimer']);
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

    handlers
      .get(
        FEATURE_EVENTS.FOCUS_TIMER_RESET,
      )
      ?.();

    expect(
      useWidgetStore
        .getState()
        .activeWidgets,
    ).toEqual(['media']);
  });

  it('activates telemetry on warning', () => {
    renderHook(() =>
      useFeatureCoordinator(),
    );

    handlers
      .get(
        FEATURE_EVENTS.TELEMETRY_WARNING,
      )
      ?.();

    expect(
      useWidgetStore
        .getState()
        .activeWidgets,
    ).toEqual(['telemetry']);
  });

  it('does not duplicate an already active widget', () => {
    useWidgetStore.setState({
      activeWidgets: ['media'],
    });

    renderHook(() =>
      useFeatureCoordinator(),
    );

    handlers
      .get(FEATURE_EVENTS.MEDIA_STARTED)
      ?.();

    handlers
      .get(FEATURE_EVENTS.MEDIA_STARTED)
      ?.();

    expect(
      useWidgetStore
        .getState()
        .activeWidgets,
    ).toEqual(['media']);
  });
});