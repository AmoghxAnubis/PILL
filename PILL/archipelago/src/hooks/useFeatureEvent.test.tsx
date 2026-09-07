import {
  act,
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

import { useFeatureEvent } from './useFeatureEvent';

import {
  clearFeatureEventListeners,
  emitFeatureEvent,
  FEATURE_EVENTS,
} from '../lib/featureEvents';

describe('useFeatureEvent', () => {
  beforeEach(() => {
    clearFeatureEventListeners();
  });

  afterEach(() => {
    clearFeatureEventListeners();
  });

  it('receives feature events', () => {
    const handler = vi.fn();

    renderHook(() =>
      useFeatureEvent(
        FEATURE_EVENTS.MEDIA_STARTED,
        handler,
      ),
    );

    act(() => {
      emitFeatureEvent(
        FEATURE_EVENTS.MEDIA_STARTED,
        {
          app_id: 'Spotify',
          title: 'Test Song',
          artist: 'Test Artist',
        },
      );
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      app_id: 'Spotify',
      title: 'Test Song',
      artist: 'Test Artist',
    });
  });

  it('unsubscribes on unmount', () => {
    const handler = vi.fn();

    const { unmount } = renderHook(() =>
      useFeatureEvent(
        FEATURE_EVENTS.MEDIA_PAUSED,
        handler,
      ),
    );

    unmount();

    act(() => {
      emitFeatureEvent(
        FEATURE_EVENTS.MEDIA_PAUSED,
        {
          app_id: 'Spotify',
          title: 'Test Song',
          artist: 'Test Artist',
        },
      );
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('uses the latest handler without resubscribing', () => {
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    const { rerender } = renderHook(
      ({ handler }) =>
        useFeatureEvent(
          FEATURE_EVENTS.FOCUS_TIMER_STARTED,
          handler,
        ),
      {
        initialProps: {
          handler: firstHandler,
        },
      },
    );

    rerender({
      handler: secondHandler,
    });

    act(() => {
      emitFeatureEvent(
        FEATURE_EVENTS.FOCUS_TIMER_STARTED,
        {
          seconds_remaining: 1200,
        },
      );
    });

    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledTimes(1);
  });

  it('only responds to the subscribed event', () => {
    const handler = vi.fn();

    renderHook(() =>
      useFeatureEvent(
        FEATURE_EVENTS.TELEMETRY_WARNING,
        handler,
      ),
    );

    act(() => {
      emitFeatureEvent(
        FEATURE_EVENTS.MEDIA_STARTED,
        {
          app_id: 'Spotify',
          title: 'Test Song',
          artist: 'Test Artist',
        },
      );
    });

    expect(handler).not.toHaveBeenCalled();
  });
});