import { useEffect } from 'react';

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import {
  DEFAULT_PILL_SETTINGS,
  type PillSettings,
} from '../../../shared/settings/PillSettings';

import { useSettingsStore } from '../store/settingsStore';

const SETTINGS_CHANGED_EVENT =
  'settings_changed';

export function useSettingsSource(): void {
  const setSettings = useSettingsStore(
    (state) => state.setSettings,
  );

  useEffect(() => {
    let mounted = true;

    void invoke<PillSettings>(
      'load_settings',
    )
      .then((settings) => {
        if (!mounted) {
          return;
        }

        setSettings(settings);
      })
      .catch((error) => {
        console.error(
          '[Settings] Failed to load settings:',
          error,
        );

        if (mounted) {
          setSettings(
            DEFAULT_PILL_SETTINGS,
          );
        }
      });

    let unlisten:
      | (() => void)
      | undefined;

    void listen<PillSettings>(
      SETTINGS_CHANGED_EVENT,
      (event) => {
        if (!mounted) {
          return;
        }

        setSettings(event.payload);
      },
    )
      .then((cleanup) => {
        if (!mounted) {
          cleanup();
          return;
        }

        unlisten = cleanup;
      })
      .catch((error) => {
        console.error(
          '[Settings] Failed to listen for settings changes:',
          error,
        );
      });

    return () => {
      mounted = false;
      unlisten?.();
    };
  }, [setSettings]);
}