import { useFocusTimer } from './useFocusTimer';
import { useMedia } from './useMedia';

/**
 * Mounts the application feature sources.
 *
 * Feature hooks are intentionally called here so their native
 * event subscriptions stay active regardless of which Island
 * visual state is currently mounted.
 *
 * This hook does not mutate widget state.
 * Widget activation belongs to useFeatureCoordinator().
 */
export function useFeatureSources(): void {
  useMedia();
  useFocusTimer();
}