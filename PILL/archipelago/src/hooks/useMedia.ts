import { useState } from 'react';
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

export function useMedia() {
  const [media, setMedia] = useState<MediaUpdate>(EMPTY_MEDIA);

  useTauriTypedEvent(
    TAURI_EVENTS.MEDIA_UPDATE,
    (payload: MediaUpdate) => {
      setMedia(payload);
    },
  );

  return {
    media,
    hasMedia: media.title.length > 0 || media.artist.length > 0,
  };
}