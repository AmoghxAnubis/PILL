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
  TAURI_EVENTS,
  type MediaUpdate,
  useTauriTypedEvent,
} from '../lib/tauriEvents';

import {
  clearFeatureEventListeners,
  FEATURE_EVENTS,
  subscribeToFeatureEvent,
} from '../lib/featureEvents';

import { useMediaSource } from './useMediaSource';
import { useMediaStore } from '../store/mediaStore';

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

const EMPTY_MEDIA: MediaUpdate = {
  app_id: '',
  title: '',
  artist: '',
  is_playing: false,
  duration: 0,
  position: 0,
  artwork: null,
};

let mediaHandler:
  | ((payload: MediaUpdate) => void)
  | undefined;

beforeEach(() => {
  useMediaStore.setState({
    media: EMPTY_MEDIA,
    hasMedia: false,
  });

  clearFeatureEventListeners();
  mediaHandler = undefined;

  mockedUseTauriTypedEvent.mockImplementation(
    (eventName, handler) => {
      if (
        eventName ===
        TAURI_EVENTS.MEDIA_UPDATE
      ) {
        mediaHandler =
          handler as (
            payload: MediaUpdate,
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

function emitMediaUpdate(
  payload: MediaUpdate,
): void {
  if (!mediaHandler) {
    throw new Error(
      'Media update handler was not registered',
    );
  }

  act(() => {
    mediaHandler?.(payload);
  });
}

function createMedia(
  overrides: Partial<MediaUpdate> = {},
): MediaUpdate {
  return {
    app_id: 'spotify',
    title: 'Test Song',
    artist: 'Test Artist',
    is_playing: true,
    duration: 240,
    position: 10,
    artwork: null,
    ...overrides,
  };
}

describe('useMediaSource', () => {
  it('subscribes to media updates', () => {
    renderHook(() => useMediaSource());

    expect(
      mockedUseTauriTypedEvent,
    ).toHaveBeenCalledWith(
      TAURI_EVENTS.MEDIA_UPDATE,
      expect.any(Function),
    );
  });

  it('stores media when media becomes available', () => {
    renderHook(() => useMediaSource());

    emitMediaUpdate(
      createMedia(),
    );

    const state =
      useMediaStore.getState();

    expect(state.hasMedia).toBe(true);

    expect(state.media.title).toBe(
      'Test Song',
    );

    expect(state.media.artist).toBe(
      'Test Artist',
    );
  });

  it('emits media.available when media first appears', () => {
    const handler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
      handler,
    );

    renderHook(() => useMediaSource());

    emitMediaUpdate(
      createMedia(),
    );

    expect(handler).toHaveBeenCalledTimes(1);

    expect(handler).toHaveBeenCalledWith({
      app_id: 'spotify',
      title: 'Test Song',
      artist: 'Test Artist',
      is_playing: true,
    });
  });

  it('emits media.started when playback starts', () => {
    const handler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_STARTED,
      handler,
    );

    renderHook(() => useMediaSource());

    emitMediaUpdate(
      createMedia({
        is_playing: false,
      }),
    );

    emitMediaUpdate(
      createMedia({
        is_playing: true,
        position: 11,
      }),
    );

    expect(handler).toHaveBeenCalledTimes(1);

    expect(handler).toHaveBeenCalledWith({
      app_id: 'spotify',
      title: 'Test Song',
      artist: 'Test Artist',
    });
  });

  it('emits media.paused when playback pauses', () => {
    const handler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_PAUSED,
      handler,
    );

    renderHook(() => useMediaSource());

    emitMediaUpdate(
      createMedia({
        is_playing: true,
      }),
    );

    emitMediaUpdate(
      createMedia({
        is_playing: false,
        position: 11,
      }),
    );

    expect(handler).toHaveBeenCalledTimes(1);

    expect(handler).toHaveBeenCalledWith({
      app_id: 'spotify',
      title: 'Test Song',
      artist: 'Test Artist',
    });
  });

  it('emits media.changed when the track changes', () => {
    const handler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_CHANGED,
      handler,
    );

    renderHook(() => useMediaSource());

    emitMediaUpdate(
      createMedia({
        title: 'First Song',
      }),
    );

    emitMediaUpdate(
      createMedia({
        title: 'Second Song',
        duration: 200,
        position: 0,
      }),
    );

    expect(handler).toHaveBeenCalledTimes(1);

    expect(handler).toHaveBeenCalledWith({
      app_id: 'spotify',
      title: 'Second Song',
      artist: 'Test Artist',
      is_playing: true,
    });
  });

  it('clears media when media disappears', () => {
    const handler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_UNAVAILABLE,
      handler,
    );

    renderHook(() => useMediaSource());

    emitMediaUpdate(
      createMedia(),
    );

    emitMediaUpdate(
      EMPTY_MEDIA,
    );

    const state =
      useMediaStore.getState();

    expect(state.hasMedia).toBe(false);
    expect(state.media.title).toBe('');
    expect(state.media.artist).toBe('');

    expect(handler).toHaveBeenCalledTimes(1);

    expect(handler).toHaveBeenCalledWith({
      app_id: 'spotify',
      title: 'Test Song',
      artist: 'Test Artist',
    });
  });

  it('does not emit media.unavailable when already empty', () => {
    const handler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_UNAVAILABLE,
      handler,
    );

    renderHook(() => useMediaSource());

    emitMediaUpdate(
      EMPTY_MEDIA,
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not emit duplicate events for unchanged media', () => {
    const startedHandler = vi.fn();
    const changedHandler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_STARTED,
      startedHandler,
    );

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_CHANGED,
      changedHandler,
    );

    renderHook(() => useMediaSource());

    const payload =
      createMedia();

    emitMediaUpdate(payload);
    emitMediaUpdate(payload);

    expect(
      startedHandler,
    ).not.toHaveBeenCalled();

    expect(
      changedHandler,
    ).not.toHaveBeenCalled();
  });

  it('handles multiple rapid track changes and keeps the latest track', () => {
    const changedHandler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_CHANGED,
      changedHandler,
    );

    renderHook(() => useMediaSource());

    emitMediaUpdate(
      createMedia({
        title: 'Track One',
        artist: 'Artist One',
        duration: 200,
        position: 20,
      }),
    );

    emitMediaUpdate(
      createMedia({
        title: 'Track Two',
        artist: 'Artist Two',
        duration: 180,
        position: 5,
      }),
    );

    emitMediaUpdate(
      createMedia({
        title: 'Track Three',
        artist: 'Artist Three',
        duration: 240,
        position: 1,
      }),
    );

    const state =
      useMediaStore.getState();

    expect(state.hasMedia).toBe(true);

    expect(state.media.title).toBe(
      'Track Three',
    );

    expect(state.media.artist).toBe(
      'Artist Three',
    );

    expect(state.media.duration).toBe(240);
    expect(state.media.position).toBe(1);

    expect(
      changedHandler,
    ).toHaveBeenCalledTimes(2);
  });

  it('handles rapid playback transitions without losing the final state', () => {
    const startedHandler = vi.fn();
    const pausedHandler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_STARTED,
      startedHandler,
    );

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_PAUSED,
      pausedHandler,
    );

    renderHook(() => useMediaSource());

    emitMediaUpdate(
      createMedia({
        is_playing: false,
      }),
    );

    emitMediaUpdate(
      createMedia({
        is_playing: true,
        position: 5,
      }),
    );

    emitMediaUpdate(
      createMedia({
        is_playing: false,
        position: 6,
      }),
    );

    emitMediaUpdate(
      createMedia({
        is_playing: true,
        position: 7,
      }),
    );

    const state =
      useMediaStore.getState();

    expect(
      state.media.is_playing,
    ).toBe(true);

    expect(
      state.media.position,
    ).toBe(7);

    expect(
      startedHandler,
    ).toHaveBeenCalledTimes(2);

    expect(
      pausedHandler,
    ).toHaveBeenCalledTimes(1);
  });

  it('handles media disappearing and returning as a new session', () => {
    const availableHandler = vi.fn();
    const unavailableHandler = vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
      availableHandler,
    );

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_UNAVAILABLE,
      unavailableHandler,
    );

    renderHook(() => useMediaSource());

    emitMediaUpdate(
      createMedia({
        title: 'First Song',
      }),
    );

    emitMediaUpdate(
      EMPTY_MEDIA,
    );

    emitMediaUpdate(
      createMedia({
        title: 'Second Song',
      }),
    );

    const state =
      useMediaStore.getState();

    expect(
      state.hasMedia,
    ).toBe(true);

    expect(
      state.media.title,
    ).toBe('Second Song');

    expect(
      availableHandler,
    ).toHaveBeenCalledTimes(2);

    expect(
      unavailableHandler,
    ).toHaveBeenCalledTimes(1);
  });

  it('treats whitespace-only title and artist as unavailable', () => {
    const unavailableHandler =
      vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_UNAVAILABLE,
      unavailableHandler,
    );

    renderHook(() => useMediaSource());

    emitMediaUpdate(
      createMedia(),
    );

    emitMediaUpdate({
      ...EMPTY_MEDIA,
      title: '   ',
      artist: '   ',
    });

    const state =
      useMediaStore.getState();

    expect(
      state.hasMedia,
    ).toBe(false);

    expect(
      state.media.title,
    ).toBe('');

    expect(
      state.media.artist,
    ).toBe('');

    expect(
      unavailableHandler,
    ).toHaveBeenCalledTimes(1);

    expect(
      unavailableHandler,
    ).toHaveBeenCalledWith({
      app_id: 'spotify',
      title: 'Test Song',
      artist: 'Test Artist',
    });
  });

  it('does not treat position-only changes as track changes', () => {
    const changedHandler =
      vi.fn();

    subscribeToFeatureEvent(
      FEATURE_EVENTS.MEDIA_CHANGED,
      changedHandler,
    );

    renderHook(() => useMediaSource());

    emitMediaUpdate(
      createMedia({
        position: 10,
      }),
    );

    emitMediaUpdate(
      createMedia({
        position: 11,
      }),
    );

    emitMediaUpdate(
      createMedia({
        position: 12,
      }),
    );

    expect(
      changedHandler,
    ).not.toHaveBeenCalled();

    const state =
      useMediaStore.getState();

    expect(
      state.media.position,
    ).toBe(12);
  });
});