import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModuleDashboard } from './ModuleDashboard';
import { useIslandStore } from '../../store/islandStore';
import { useSettingsStore } from '../../store/settingsStore';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn().mockResolvedValue(undefined) }));
beforeEach(() => {
  useIslandStore.setState({ selectedModule: null, pinned: false });
  useSettingsStore.getState().resetSettings();
});
afterEach(cleanup);

describe('module dashboard', () => {
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

  it('pins and unpins the current session', () => {
    render(<ModuleDashboard onCollapse={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pin island open' }));
    expect(screen.getByRole('button', { name: 'Unpin island' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Unpin island' }));
    expect(useIslandStore.getState().pinned).toBe(false);
  });
});
