import { act, renderHook } from '@testing-library/react';
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
} from '../lib/featureEvents';

import { useMedia } from './useMedia';

const listeners = new Map<
  string,
  (payload: unknown) => void
>();

vi.mock('../lib/tauriEvents', async () => {
  const actual = await vi.importActual<
    typeof import('../lib/tauriEvents')
  >('../lib/tauriEvents');

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

describe('useMedia', () => {
  beforeEach(() => {
    listeners.clear();
  });

  afterEach(() => {
    listeners.clear();
  });

  it('starts with empty media state', () => {
    const { result } =
      renderHook(() => useMedia());

    expect(result.current.hasMedia).toBe(false);
    expect(result.current.media.title).toBe('');
    expect(result.current.media.artist).toBe('');
    expect(result.current.media.is_playing).toBe(false);
  });

  it('updates media from media_update events', () => {
    const { result } =
      renderHook(() => useMedia());

    const handler =
      listeners.get('media_update');

    expect(handler).toBeDefined();

    act(() => {
      handler?.({
        app_id: 'Spotify',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: true,
        duration: 240,
        position: 30,
        artwork: null,
      });
    });

    expect(result.current.hasMedia).toBe(true);
    expect(result.current.media.title).toBe(
      'Test Song',
    );
    expect(result.current.media.artist).toBe(
      'Test Artist',
    );
    expect(
      result.current.media.is_playing,
    ).toBe(true);
    expect(
      result.current.media.position,
    ).toBe(30);
  });

  it('does not emit an event for the first media payload', () => {
    const startedHandler = vi.fn();
    const pausedHandler = vi.fn();
    const changedHandler = vi.fn();

    const unsubStarted =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.MEDIA_STARTED,
        startedHandler,
      );

    const unsubPaused =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.MEDIA_PAUSED,
        pausedHandler,
      );

    const unsubChanged =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.MEDIA_CHANGED,
        changedHandler,
      );

    renderHook(() => useMedia());

    const handler =
      listeners.get('media_update');

    act(() => {
      handler?.({
        app_id: 'Spotify',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: true,
        duration: 240,
        position: 0,
        artwork: null,
      });
    });

    expect(startedHandler).not.toHaveBeenCalled();
    expect(pausedHandler).not.toHaveBeenCalled();
    expect(changedHandler).not.toHaveBeenCalled();

    unsubStarted();
    unsubPaused();
    unsubChanged();
  });

  it('emits media.started when playback changes from paused to playing', () => {
    const handler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.MEDIA_STARTED,
        handler,
      );

    renderHook(() => useMedia());

    const mediaHandler =
      listeners.get('media_update');

    expect(mediaHandler).toBeDefined();

    act(() => {
      mediaHandler?.({
        app_id: 'Spotify',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: false,
        duration: 240,
        position: 30,
        artwork: null,
      });
    });

    act(() => {
      mediaHandler?.({
        app_id: 'Spotify',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: true,
        duration: 240,
        position: 31,
        artwork: null,
      });
    });

    expect(handler).toHaveBeenCalledTimes(1);

    expect(handler).toHaveBeenCalledWith({
      app_id: 'Spotify',
      title: 'Test Song',
      artist: 'Test Artist',
    });

    unsubscribe();
  });

  it('emits media.paused when playback changes from playing to paused', () => {
    const handler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.MEDIA_PAUSED,
        handler,
      );

    renderHook(() => useMedia());

    const mediaHandler =
      listeners.get('media_update');

    expect(mediaHandler).toBeDefined();

    act(() => {
      mediaHandler?.({
        app_id: 'Spotify',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: true,
        duration: 240,
        position: 30,
        artwork: null,
      });
    });

    act(() => {
      mediaHandler?.({
        app_id: 'Spotify',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: false,
        duration: 240,
        position: 31,
        artwork: null,
      });
    });

    expect(handler).toHaveBeenCalledTimes(1);

    expect(handler).toHaveBeenCalledWith({
      app_id: 'Spotify',
      title: 'Test Song',
      artist: 'Test Artist',
    });

    unsubscribe();
  });

  it('emits media.changed when track metadata changes', () => {
    const handler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.MEDIA_CHANGED,
        handler,
      );

    renderHook(() => useMedia());

    const mediaHandler =
      listeners.get('media_update');

    expect(mediaHandler).toBeDefined();

    act(() => {
      mediaHandler?.({
        app_id: 'Spotify',
        title: 'First Song',
        artist: 'Artist One',
        is_playing: true,
        duration: 240,
        position: 30,
        artwork: null,
      });
    });

    act(() => {
      mediaHandler?.({
        app_id: 'Spotify',
        title: 'Second Song',
        artist: 'Artist Two',
        is_playing: true,
        duration: 180,
        position: 0,
        artwork: null,
      });
    });

    expect(handler).toHaveBeenCalledTimes(1);

    expect(handler).toHaveBeenCalledWith({
      app_id: 'Spotify',
      title: 'Second Song',
      artist: 'Artist Two',
      is_playing: true,
    });

    unsubscribe();
  });

  it('does not emit media.changed for position-only updates', () => {
    const handler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.MEDIA_CHANGED,
        handler,
      );

    renderHook(() => useMedia());

    const mediaHandler =
      listeners.get('media_update');

    expect(mediaHandler).toBeDefined();

    act(() => {
      mediaHandler?.({
        app_id: 'Spotify',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: true,
        duration: 240,
        position: 30,
        artwork: null,
      });
    });

    act(() => {
      mediaHandler?.({
        app_id: 'Spotify',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: true,
        duration: 240,
        position: 31,
        artwork: null,
      });
    });

    act(() => {
      mediaHandler?.({
        app_id: 'Spotify',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: true,
        duration: 240,
        position: 32,
        artwork: null,
      });
    });

    expect(handler).not.toHaveBeenCalled();

    unsubscribe();
  });

  it('does not emit media.started when playback remains playing', () => {
    const handler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.MEDIA_STARTED,
        handler,
      );

    renderHook(() => useMedia());

    const mediaHandler =
      listeners.get('media_update');

    act(() => {
      mediaHandler?.({
        app_id: 'Spotify',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: true,
        duration: 240,
        position: 0,
        artwork: null,
      });
    });

    act(() => {
      mediaHandler?.({
        app_id: 'Spotify',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: true,
        duration: 240,
        position: 10,
        artwork: null,
      });
    });

    expect(handler).not.toHaveBeenCalled();

    unsubscribe();
  });

  it('does not emit media.paused when playback remains paused', () => {
    const handler = vi.fn();

    const unsubscribe =
      subscribeToFeatureEvent(
        FEATURE_EVENTS.MEDIA_PAUSED,
        handler,
      );

    renderHook(() => useMedia());

    const mediaHandler =
      listeners.get('media_update');

    act(() => {
      mediaHandler?.({
        app_id: 'Spotify',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: false,
        duration: 240,
        position: 0,
        artwork: null,
      });
    });

    act(() => {
      mediaHandler?.({
        app_id: 'Spotify',
        title: 'Test Song',
        artist: 'Test Artist',
        is_playing: false,
        duration: 240,
        position: 10,
        artwork: null,
      });
    });

    expect(handler).not.toHaveBeenCalled();

    unsubscribe();
  });
});