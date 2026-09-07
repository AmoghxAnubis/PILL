import { useRef, useState } from 'react';

import {
  FEATURE_EVENTS,
  emitFeatureEvent,
} from '../lib/featureEvents';

import {
  TAURI_EVENTS,
  useTauriTypedEvent,
  type MediaUpdate,
} from '../lib/tauriEvents';

const EMPTY_MEDIA: MediaUpdate = {
  app_id: '',
  title: '',
  artist: '',
  is_playing: false,
  duration: 0,
  position: 0,
  artwork: null,
};

interface MeaningfulMediaState {
  app_id: string;
  title: string;
  artist: string;
  is_playing: boolean;
}

export function useMedia() {
  const [media, setMedia] =
    useState<MediaUpdate>(EMPTY_MEDIA);

  const previousMeaningfulStateRef =
    useRef<MeaningfulMediaState | null>(null);

  useTauriTypedEvent(
    TAURI_EVENTS.MEDIA_UPDATE,
    (payload: MediaUpdate) => {
      const previous =
        previousMeaningfulStateRef.current;

      const next: MeaningfulMediaState = {
        app_id: payload.app_id,
        title: payload.title,
        artist: payload.artist,
        is_playing: payload.is_playing,
      };

      if (previous) {
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
      }

      previousMeaningfulStateRef.current = next;
      setMedia(payload);
    },
  );

  return {
    media,
    hasMedia:
      media.title.length > 0 ||
      media.artist.length > 0,
  };
}