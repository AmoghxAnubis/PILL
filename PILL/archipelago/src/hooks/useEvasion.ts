import {
  useCallback,
  useEffect,
  useRef,
} from 'react';

import { invoke } from '@tauri-apps/api/core';

import {
  TAURI_EVENTS,
  useTauriTypedEvent,
} from '../lib/tauriEvents';

import { useIslandStore } from '../store/islandStore';

import {
  useSettingsStore,
} from '../store/settingsStore';

/**
 * Connects the fullscreen/evasion event from the native backend
 * to both React state and native window input behavior.
 */
export function useEvasion() {
  const setEvasionActive =
    useIslandStore(
      (state) => state.setEvasionActive,
    );

  const fullscreenEvasionEnabled =
    useSettingsStore(
      (settingsState) =>
        settingsState.settings.behavior
          .fullscreenEvasion,
    );

  const fullscreenActiveRef =
    useRef(false);

  const previousEvasionSettingRef =
    useRef(fullscreenEvasionEnabled);

  const setClickThrough =
    useCallback(async (
      enabled: boolean,
    ) => {
      try {
        await invoke(
          'set_click_through',
          {
            enabled,
          },
        );
      } catch (error) {
        console.error(
          '[Evasion] Failed to update native click-through:',
          error,
        );
      }
    }, []);

  const handleFullscreenStateChanged =
    useCallback(
      async (
        payload: {
          active: boolean;
        },
      ) => {
        fullscreenActiveRef.current =
          payload.active;

        const shouldEvade =
          fullscreenEvasionEnabled &&
          payload.active;

        setEvasionActive(
          shouldEvade,
        );

        await setClickThrough(
          shouldEvade,
        );
      },
      [
        fullscreenEvasionEnabled,
        setEvasionActive,
        setClickThrough,
      ],
    );

  useTauriTypedEvent(
    TAURI_EVENTS.FULLSCREEN_STATE_CHANGED,
    handleFullscreenStateChanged,
  );

  useEffect(() => {
    const previousSetting =
      previousEvasionSettingRef.current;

    if (
      previousSetting ===
      fullscreenEvasionEnabled
    ) {
      return;
    }

    previousEvasionSettingRef.current =
      fullscreenEvasionEnabled;

    const shouldEvade =
      fullscreenEvasionEnabled &&
      fullscreenActiveRef.current;

    setEvasionActive(
      shouldEvade,
    );

    void setClickThrough(
      shouldEvade,
    );
  }, [
    fullscreenEvasionEnabled,
    setEvasionActive,
    setClickThrough,
  ]);
}