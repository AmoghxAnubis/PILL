import { useCallback, useEffect, useRef } from 'react';
import { TAURI_EVENTS, useTauriTypedEvent } from '../lib/tauriEvents';
import { synchronizeIslandWindow } from '../lib/islandCoordinator';
import { useIslandStore } from '../store/islandStore';
import { useSettingsStore } from '../store/settingsStore';

/** Fullscreen policy uses the same native queue as presentation transitions. */
export function useEvasion() {
  const enabled = useSettingsStore((store) => store.settings.behavior.fullscreenEvasion);
  const fullscreen = useRef(false);
  const previousEnabled = useRef(enabled);
  const applyEvasion = useCallback(async (active: boolean) => {
    useIslandStore.getState().setEvasionActive(enabled && active);
    await synchronizeIslandWindow();
  }, [enabled]);

  const handleFullscreen = useCallback(async (payload: { active: boolean }) => {
    fullscreen.current = payload.active;
    await applyEvasion(payload.active);
  }, [applyEvasion]);

  useTauriTypedEvent(TAURI_EVENTS.FULLSCREEN_STATE_CHANGED, handleFullscreen);
  useEffect(() => {
    if (previousEnabled.current === enabled) return;
    previousEnabled.current = enabled;
    void applyEvasion(fullscreen.current);
  }, [enabled, applyEvasion]);
}
