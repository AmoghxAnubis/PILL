import { useRef } from 'react';

import {
  FEATURE_EVENTS,
  emitFeatureEvent,
} from '../lib/featureEvents';

import {
  recordMediaEvent,
} from '../lib/perfDiagnostics';

import {
  TAURI_EVENTS,
  useTauriTypedEvent,
  type MediaUpdate,
} from '../lib/tauriEvents';

import { useMediaStore } from '../store/mediaStore';

interface MeaningfulMediaState {
  app_id: string;
  title: string;
  artist: string;
  is_playing: boolean;
}

function hasMediaPayload(
  payload: MediaUpdate,
): boolean {
  return (
    payload.title.trim().length > 0 ||
    payload.artist.trim().length > 0
  );
}

export function useMediaSource(): void {
  const setMedia = useMediaStore(
    (state) => state.setMedia,
  );

  const clearMedia = useMediaStore(
    (state) => state.clearMedia,
  );

  const previousMeaningfulStateRef =
    useRef<MeaningfulMediaState | null>(
      null,
    );

  useTauriTypedEvent(
    TAURI_EVENTS.MEDIA_UPDATE,
    (payload: MediaUpdate) => {
      recordMediaEvent();

      const currentHasMedia =
        hasMediaPayload(payload);

      const previous =
        previousMeaningfulStateRef.current;

      if (!currentHasMedia) {
        if (previous) {
          emitFeatureEvent(
            FEATURE_EVENTS.MEDIA_UNAVAILABLE,
            {
              app_id: previous.app_id,
              title: previous.title,
              artist: previous.artist,
            },
          );
        }

        previousMeaningfulStateRef.current =
          null;

        clearMedia();

        return;
      }

      const next: MeaningfulMediaState = {
        app_id: payload.app_id,
        title: payload.title,
        artist: payload.artist,
        is_playing: payload.is_playing,
      };

      if (!previous) {
        emitFeatureEvent(
          FEATURE_EVENTS.MEDIA_AVAILABLE,
          {
            app_id: payload.app_id,
            title: payload.title,
            artist: payload.artist,
            is_playing: payload.is_playing,
          },
        );

        previousMeaningfulStateRef.current =
          next;

        setMedia(payload);

        return;
      }

      const trackChanged =
        previous.app_id !== next.app_id ||
        previous.title !== next.title ||
        previous.artist !== next.artist;

      const playbackStarted =
        !previous.is_playing &&
        next.is_playing;

      const playbackPaused =
        previous.is_playing &&
        !next.is_playing;

      if (playbackStarted) {
        emitFeatureEvent(
          FEATURE_EVENTS.MEDIA_STARTED,
          {
            app_id: payload.app_id,
            title: payload.title,
            artist: payload.artist,
          },
        );
      }

      if (playbackPaused) {
        emitFeatureEvent(
          FEATURE_EVENTS.MEDIA_PAUSED,
          {
            app_id: payload.app_id,
            title: payload.title,
            artist: payload.artist,
          },
        );
      }

      if (trackChanged) {
        emitFeatureEvent(
          FEATURE_EVENTS.MEDIA_CHANGED,
          {
            app_id: payload.app_id,
            title: payload.title,
            artist: payload.artist,
            is_playing: payload.is_playing,
          },
        );
      }

      previousMeaningfulStateRef.current =
        next;

      setMedia(payload);
    },
  );
}