import { useIslandStore } from '../store/islandStore';
import {
  TAURI_EVENTS,
  useTauriTypedEvent,
} from '../lib/tauriEvents';

export function useEvasion() {
  const setEvasionActive = useIslandStore(
    (state) => state.setEvasionActive,
  );

  useTauriTypedEvent(
    TAURI_EVENTS.FULLSCREEN_STATE_CHANGED,
    (payload) => {
      setEvasionActive(payload.active);
    },
  );
}