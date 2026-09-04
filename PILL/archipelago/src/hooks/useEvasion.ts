import { invoke } from '@tauri-apps/api/core';

import {
  TAURI_EVENTS,
  useTauriTypedEvent,
} from '../lib/tauriEvents';

import { useIslandStore } from '../store/islandStore';

/**
 * Connects the fullscreen/evasion event from the native backend
 * to both React state and native window input behavior.
 */
export function useEvasion() {
  const setEvasionActive = useIslandStore(
    (state) => state.setEvasionActive,
  );

  useTauriTypedEvent(
    TAURI_EVENTS.FULLSCREEN_STATE_CHANGED,
    async (payload) => {
      setEvasionActive(payload.active);

      try {
        await invoke('set_click_through', {
          enabled: payload.active,
        });
      } catch (error) {
        console.error(
          '[Evasion] Failed to update native click-through:',
          error,
        );
      }
    },
  );
}