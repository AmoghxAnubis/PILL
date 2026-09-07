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

const mockedUseTauriTypedEvent = vi.mocked(
  useTauriTypedEvent,
);

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
    (
      eventName,
      handler,
    ) => {
      if (
        eventName ===
        TAURI_EVENTS.MEDIA_UPDATE
      ) {
        mediaHandler =
          handler as (payload: MediaUpdate) => void;
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
) {
  if (!mediaHandler) {
    throw new Error(
      'Media update handler was not registered',
    );
  }

  act(() => {
    mediaHandler?.(payload);
  });
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

    emitMediaUpdate({
      app_id: 'spotify',
      title: 'Test Song',
      artist: 'Test Artist',
      is_playing: true,
      duration: 240,
      position: 10,
      artwork: null,
    });

    const state = useMediaStore.getState();

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

    emitMediaUpdate({
      app_id: 'spotify',
      title: 'Test Song',
      artist: 'Test Artist',
      is_playing: true,
      duration: 240,
      position: 10,
      artwork: null,
    });

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

    emitMediaUpdate({
      app_id: 'spotify',
      title: 'Test Song',
      artist: 'Test Artist',
      is_playing: false,
      duration: 240,
      position: 10,
      artwork: null,
    });

    emitMediaUpdate({
      app_id: 'spotify',
      title: 'Test Song',
      artist: 'Test Artist',
      is_playing: true,
      duration: 240,
      position: 11,
      artwork: null,
    });

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

    emitMediaUpdate({
      app_id: 'spotify',
      title: 'Test Song',
      artist: 'Test Artist',
      is_playing: true,
      duration: 240,
      position: 10,
      artwork: null,
    });

    emitMediaUpdate({
      app_id: 'spotify',
      title: 'Test Song',
      artist: 'Test Artist',
      is_playing: false,
      duration: 240,
      position: 11,
      artwork: null,
    });

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

    emitMediaUpdate({
      app_id: 'spotify',
      title: 'First Song',
      artist: 'Artist',
      is_playing: true,
      duration: 240,
      position: 10,
      artwork: null,
    });

    emitMediaUpdate({
      app_id: 'spotify',
      title: 'Second Song',
      artist: 'Artist',
      is_playing: true,
      duration: 200,
      position: 0,
      artwork: null,
    });

    expect(handler).toHaveBeenCalledWith({
      app_id: 'spotify',
      title: 'Second Song',
      artist: 'Artist',
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

    emitMediaUpdate({
      app_id: 'spotify',
      title: 'Test Song',
      artist: 'Test Artist',
      is_playing: true,
      duration: 240,
      position: 10,
      artwork: null,
    });

    emitMediaUpdate(EMPTY_MEDIA);

    const state = useMediaStore.getState();

    expect(state.hasMedia).toBe(false);
    expect(state.media.title).toBe('');

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

    emitMediaUpdate(EMPTY_MEDIA);

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

    const payload: MediaUpdate = {
      app_id: 'spotify',
      title: 'Test Song',
      artist: 'Test Artist',
      is_playing: true,
      duration: 240,
      position: 10,
      artwork: null,
    };

    emitMediaUpdate(payload);
    emitMediaUpdate(payload);

    expect(startedHandler).not.toHaveBeenCalled();
    expect(changedHandler).not.toHaveBeenCalled();
  });
});