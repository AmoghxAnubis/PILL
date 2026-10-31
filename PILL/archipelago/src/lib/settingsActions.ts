import { invoke } from '@tauri-apps/api/core';
import { createSettingsClient } from '../../../shared/settings/client';
import type { SettingsPatch } from '../../../shared/settings/PillSettings';
import { useSettingsStore } from '../store/settingsStore';
import { useIslandStore } from '../store/islandStore';

const client = createSettingsClient(invoke);
let latestWrite = 0;

export async function persistSettingsPatch(patch: SettingsPatch): Promise<void> {
  const write = ++latestWrite;
  useSettingsStore.setState({ saveStatus: 'saving', saveError: null });
  try {
    const settings = await client.patch(patch);
    useSettingsStore.getState().setSettings(settings);
    if (write === latestWrite) useSettingsStore.setState({ saveStatus: 'saved' });
  } catch (error) {
    if (write === latestWrite) useSettingsStore.setState({ saveStatus: 'error', saveError: String(error) });
    throw error;
  }
}

export function persistPin(pinned: boolean): void {
  useIslandStore.getState().setPinned(pinned);
  void persistSettingsPatch({ behavior: { pinExpanded: pinned } }).catch(() => {
    useIslandStore.getState().setPinned(useSettingsStore.getState().settings.behavior.pinExpanded);
  });
}

export function openControl(): void {
  void invoke('open_control').catch((error) => {
    useSettingsStore.setState({ saveStatus: 'error', saveError: String(error) });
  });
}
