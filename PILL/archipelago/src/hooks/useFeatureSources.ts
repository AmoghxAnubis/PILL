import { useFocusTimer } from './useFocusTimer';
import { useMediaSource } from './useMediaSource';

export function useFeatureSources(): void {
  useMediaSource();
  useFocusTimer();
}