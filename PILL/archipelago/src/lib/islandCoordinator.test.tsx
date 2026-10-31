import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { useIslandState } from '../hooks/useIslandState';
import { useIslandStore, ISLAND_DIMENSIONS } from '../store/islandStore';
import { useWidgetStore } from '../store/widgetStore';
import { useSettingsStore } from '../store/settingsStore';
import { DEFAULT_PILL_SETTINGS } from '../../../shared/settings/PillSettings';
import { synchronizeIslandWindow } from './islandCoordinator';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn().mockResolvedValue(undefined) }));
const mockedInvoke = vi.mocked(invoke);

beforeEach(() => {
  mockedInvoke.mockReset().mockResolvedValue(undefined);
  useIslandStore.setState({ state: 'idle', visible: true, isEvasionActive: false, pinned: false, selectedModule: null });
  useWidgetStore.getState().clearWidgets();
  useSettingsStore.getState().resetSettings();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('shared island coordinator', () => {
  it('coalesces requests from multiple callers to the newest presentation', async () => {
    const first = renderHook(useIslandState);
    const second = renderHook(useIslandState);
    await act(async () => {
      const compact = first.result.current.transitionTo('compact');
      const expanded = second.result.current.transitionTo('expanded');
      await Promise.all([compact, expanded]);
    });
    expect(useIslandStore.getState().state).toBe('expanded');
    expect(mockedInvoke.mock.calls.filter(([command]) => command === 'resize_island'))
      .toEqual([['resize_island', ISLAND_DIMENSIONS.expanded]]);
  });

  it('cancels a collapse scheduled by another hook when the pointer returns', async () => {
    vi.useFakeTimers();
    useIslandStore.setState({ state: 'expanded' });
    const first = renderHook(useIslandState);
    const second = renderHook(useIslandState);
    act(() => first.result.current.scheduleCollapse(100));
    act(() => second.result.current.handleMouseEnter());
    await act(async () => { vi.advanceTimersByTime(150); });
    expect(useIslandStore.getState().state).toBe('expanded');
  });

  it('does not restore input while an in-flight resize is superseded by fullscreen', async () => {
    let completeResize!: () => void;
    mockedInvoke.mockImplementation((command) => command === 'resize_island'
      ? new Promise<void>((resolve) => { completeResize = resolve; }) as ReturnType<typeof invoke>
      : Promise.resolve(undefined) as ReturnType<typeof invoke>);
    const hook = renderHook(useIslandState);
    let transition!: Promise<void>;
    act(() => { transition = hook.result.current.transitionTo('expanded'); });
    await act(async () => { await Promise.resolve(); });
    expect(mockedInvoke).toHaveBeenCalledWith('resize_island', ISLAND_DIMENSIONS.expanded);
    useIslandStore.getState().setEvasionActive(true);
    const evasion = synchronizeIslandWindow();
    await act(async () => { completeResize(); await transition; await evasion; });
    const inputCalls = mockedInvoke.mock.calls.filter(([command]) => command === 'set_click_through');
    expect(inputCalls).toEqual([['set_click_through', { enabled: true }]]);
  });

  it('uses current widgets when a delayed collapse executes', async () => {
    vi.useFakeTimers();
    useIslandStore.setState({ state: 'expanded' });
    const hook = renderHook(useIslandState);
    act(() => hook.result.current.scheduleCollapse(100));
    useWidgetStore.getState().activateWidget('media');
    await act(async () => { vi.advanceTimersByTime(100); });
    expect(useIslandStore.getState().state).toBe('compact');
  });

  it('preserves a pinned surface and cancels pending timers on final unmount', async () => {
    vi.useFakeTimers();
    useIslandStore.setState({ state: 'expanded', pinned: true });
    const hook = renderHook(useIslandState);
    act(() => hook.result.current.scheduleCollapse(100));
    await act(async () => { vi.advanceTimersByTime(100); });
    expect(useIslandStore.getState().state).toBe('expanded');
    act(() => {
      useIslandStore.getState().setPinned(false);
      hook.result.current.scheduleCollapse(100);
    });
    hook.unmount();
    await act(async () => { vi.advanceTimersByTime(100); });
    expect(useIslandStore.getState().state).toBe('expanded');
  });

  it('cancels a pending leave when auto-collapse is disabled live', async () => {
    vi.useFakeTimers();
    useIslandStore.setState({ state: 'expanded' });
    const hook = renderHook(useIslandState);
    act(() => hook.result.current.handleMouseLeave());
    act(() => useSettingsStore.getState().updateBehavior({ autoCollapse: false }));
    await act(async () => { vi.advanceTimersByTime(DEFAULT_PILL_SETTINGS.behavior.collapseDelayMs); });
    expect(useIslandStore.getState().state).toBe('expanded');
  });
});
