import { create } from 'zustand';

import type { MediaUpdate } from '../lib/tauriEvents';

const EMPTY_MEDIA: MediaUpdate = {
  app_id: '',
  title: '',
  artist: '',
  is_playing: false,
  duration: 0,
  position: 0,
  artwork: null,
};

interface MediaStore {
  media: MediaUpdate;
  hasMedia: boolean;
  setMedia: (media: MediaUpdate) => void;
  clearMedia: () => void;
}

function hasMediaPayload(
  payload: MediaUpdate,
): boolean {
  return (
    payload.title.trim().length > 0 ||
    payload.artist.trim().length > 0
  );
}

export const useMediaStore =
  create<MediaStore>((set) => ({
    media: EMPTY_MEDIA,
    hasMedia: false,

    setMedia: (media) => {
      set({
        media,
        hasMedia: hasMediaPayload(media),
      });
    },

    clearMedia: () => {
      set({
        media: EMPTY_MEDIA,
        hasMedia: false,
      });
    },
  }));