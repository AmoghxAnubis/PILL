import { invoke } from '@tauri-apps/api/core';
import { createSettingsClient } from '../../../shared/settings/client';
const client = createSettingsClient(invoke);
export const loadSettings = client.load;
export const patchSettings = client.patch;
export const resetSavedSettings = client.reset;
