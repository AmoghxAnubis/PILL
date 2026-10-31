import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { QuickSettings } from './QuickSettings';
import { useSettingsStore } from '../../store/settingsStore';
import { DEFAULT_PILL_SETTINGS, type SettingsPatch } from '../../../../shared/settings/PillSettings';
import { mergeSettings } from '../../../../shared/settings/merge';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
beforeEach(() => {
  useSettingsStore.setState({ settings: DEFAULT_PILL_SETTINGS, saveStatus: 'idle', saveError: null, loadError: null });
  vi.mocked(invoke).mockReset();
});
afterEach(cleanup);

describe('persistent quick settings', () => {
  it('saves a partial update and renders the authoritative native result', async () => {
    vi.mocked(invoke).mockImplementation((_command, args) => Promise.resolve({ ...mergeSettings(DEFAULT_PILL_SETTINGS, (args as { patch?: SettingsPatch } | undefined)?.patch ?? {}), revision: 1 }) as ReturnType<typeof invoke>);
    render(<QuickSettings onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'purple' } });
    await waitFor(() => expect(screen.getByLabelText('Theme')).toHaveValue('purple'));
    expect(invoke).toHaveBeenCalledWith('update_settings', { patch: { appearance: { theme: 'purple' } } });
    expect(useSettingsStore.getState().settings.revision).toBe(1);
  });

  it('keeps existing settings and explains a failed save', async () => {
    vi.mocked(invoke).mockRejectedValueOnce('Settings are busy. Please try again.');
    render(<QuickSettings onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Background opacity'), { target: { value: '0.7' } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Settings are busy');
    expect(useSettingsStore.getState().settings.appearance.opacity).toBe(1);
  });

  it('closes on Escape and traps focus within the settings surface', () => {
    const close = vi.fn();
    render(<QuickSettings onClose={close} />);
    const dialog = screen.getByRole('dialog');
    expect(screen.getByRole('button', { name: 'Close quick settings' })).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('button', { name: /Open PILL Control/ })).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(close).toHaveBeenCalledOnce();
  });
});
