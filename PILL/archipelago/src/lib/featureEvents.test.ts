import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  clearFeatureEventListeners,
  emitFeatureEvent,
  FEATURE_EVENTS,
  subscribeToFeatureEvent,
} from './featureEvents';

afterEach(() => {
  clearFeatureEventListeners();
});

describe('featureEvents', () => {
  it('delivers an event payload to subscribers', () => {
    const handler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_STARTED,
      handler,
    );

    emitFeatureEvent(
      FEATURE_EVENTS.MEDIA_STARTED,
      {
        app_id: 'Spotify',
        title: 'Test Song',
        artist: 'Test Artist',
      },
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      app_id: 'Spotify',
      title: 'Test Song',
      artist: 'Test Artist',
    });
  });

  it('supports multiple subscribers', () => {
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.FOCUS_TIMER_STARTED,
      firstHandler,
    );

    subscribeToFeatureEvent(
      FEATURE_EVENTS.FOCUS_TIMER_STARTED,
      secondHandler,
    );

    emitFeatureEvent(
      FEATURE_EVENTS.FOCUS_TIMER_STARTED,
      {
        seconds_remaining: 1500,
      },
    );

    expect(firstHandler).toHaveBeenCalledTimes(1);
    expect(secondHandler).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes a listener', () => {
    const handler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.MEDIA_PAUSED,
        handler,
      );

    unsubscribe();

    emitFeatureEvent(
      FEATURE_EVENTS.MEDIA_PAUSED,
      {
        app_id: 'Spotify',
        title: 'Test Song',
        artist: 'Test Artist',
      },
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not deliver events across different event names', () => {
    const mediaHandler = vi.fn();
    const timerHandler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_STARTED,
      mediaHandler,
    );

    subscribeToFeatureEvent(
      FEATURE_EVENTS.FOCUS_TIMER_STARTED,
      timerHandler,
    );

    emitFeatureEvent(
      FEATURE_EVENTS.MEDIA_STARTED,
      {
        app_id: 'Spotify',
        title: 'Test Song',
        artist: 'Test Artist',
      },
    );

    expect(mediaHandler).toHaveBeenCalledTimes(1);
    expect(timerHandler).not.toHaveBeenCalled();
  });

  it('allows the same handler to be removed cleanly', () => {
    const handler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.TELEMETRY_WARNING,
        handler,
      );

    unsubscribe();

    unsubscribe();

    emitFeatureEvent(
      FEATURE_EVENTS.TELEMETRY_WARNING,
      {
        cpu_usage: 95,
        ram_percentage: 91,
      },
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it('silently ignores events with no subscribers', () => {
    expect(() => {
      emitFeatureEvent(
        FEATURE_EVENTS.FOCUS_TIMER_RESET,
        {
          seconds_remaining: 1500,
        },
      );
    }).not.toThrow();
  });
});