import { invoke } from '@tauri-apps/api/core';

import {
  DEFAULT_PILL_SETTINGS,
  type PillSettings,
} from '../../../shared/settings/PillSettings';

let saveQueue: Promise<void> = Promise.resolve();

export async function loadSettings(): Promise<PillSettings> {
  try {
    return await invoke<PillSettings>(
      'load_settings',
    );
  } catch (error) {
    console.error(
      '[PILL Control] Failed to load settings:',
      error,
    );

    return DEFAULT_PILL_SETTINGS;
  }
}

export function saveSettings(
  settings: PillSettings,
): Promise<void> {
  const operation = saveQueue
    .catch(() => undefined)
    .then(() =>
      invoke<void>('save_settings', {
        settings,
      }),
    );

  saveQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}