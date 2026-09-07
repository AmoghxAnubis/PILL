import { useFocusTimerSource } from './useFocusTimerSource';
import { useMediaSource } from './useMediaSource';

export function useFeatureSources(): void {
  useMediaSource();
  useFocusTimerSource();
}