import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModuleDashboard } from './ModuleDashboard';
import { useIslandStore } from '../../store/islandStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTelemetryStore } from '../../store/telemetryStore';
import { invoke } from '@tauri-apps/api/core';
import { mergeSettings } from '../../../../shared/settings/merge';
import type { SettingsPatch } from '../../../../shared/settings/PillSettings';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn().mockResolvedValue(undefined) }));
beforeEach(() => {
  vi.mocked(invoke).mockImplementation((_command, args) => Promise.resolve({ ...mergeSettings(useSettingsStore.getState().settings, args?.patch as SettingsPatch), revision: useSettingsStore.getState().settings.revision + 1 }) as ReturnType<typeof invoke>);
  useIslandStore.setState({ selectedModule: null, pinned: false });
  useSettingsStore.getState().resetSettings();
  useTelemetryStore.getState().clearTelemetry();
});
afterEach(cleanup);

describe('module dashboard', () => {
  it('shows unavailable telemetry until an actual sample arrives', () => {
    render(<ModuleDashboard onCollapse={() => {}} />);
    fireEvent.click(screen.getByRole('tab', { name: 'System' }));
    expect(screen.getByText('Waiting for system data')).toBeInTheDocument();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    act(() => useTelemetryStore.getState().setTelemetry(42, 57));
    expect(screen.getByRole('meter', { name: 'CPU usage' })).toHaveAttribute('value', '42');
  });

  it('preserves an explicit calendar selection when background media takes priority', () => {
    const { rerender } = render(<ModuleDashboard onCollapse={() => {}} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Calendar' }));
    rerender(<ModuleDashboard onCollapse={() => {}} widgetOrchestration={{ layout: 'single', primary: 'media', secondary: null }} />);
    expect(screen.getByRole('tab', { name: 'Calendar' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Calendar');
  });

  it('supports keyboard navigation and falls back when the selected module is disabled', () => {
    render(<ModuleDashboard onCollapse={() => {}} />);
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Weather' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Media' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Media');
    act(() => useSettingsStore.getState().updateWidgets({ media: false }));
    expect(screen.queryByRole('tab', { name: 'Media' })).not.toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Calendar');
  });

  it('offers a startable focus view even before a session is active', () => {
    render(<ModuleDashboard onCollapse={() => {}} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Focus' }));
    expect(screen.getByRole('button', { name: 'Start focus timer' })).toBeInTheDocument();
  });

  it('persists pin and unpin choices', async () => {
    render(<ModuleDashboard onCollapse={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pin island open' }));
    expect(screen.getByRole('button', { name: 'Unpin island' })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(useSettingsStore.getState().settings.behavior.pinExpanded).toBe(true));
    fireEvent.click(screen.getByRole('button', { name: 'Unpin island' }));
    expect(useIslandStore.getState().pinned).toBe(false);
    await waitFor(() => expect(useSettingsStore.getState().settings.behavior.pinExpanded).toBe(false));
  });
});
