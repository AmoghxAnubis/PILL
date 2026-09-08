import { useFocusTimerSource } from './useFocusTimerSource';
import { useMediaSource } from './useMediaSource';
import { useTelemetrySource } from './useTelemetrySource';

export function useFeatureSources(): void {
  useMediaSource();
  useFocusTimerSource();
  useTelemetrySource();
}