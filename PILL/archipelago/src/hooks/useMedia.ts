import { useMediaStore } from '../store/mediaStore';

export function useMedia() {
  const media = useMediaStore(
    (state) => state.media,
  );

  const hasMedia = useMediaStore(
    (state) => state.hasMedia,
  );

  return {
    media,
    hasMedia,
  };
}