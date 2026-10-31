import { invoke } from '@tauri-apps/api/core';
import { ISLAND_DIMENSIONS, isIslandVisible, useIslandStore, type IslandState } from '../store/islandStore';
import { useWidgetStore } from '../store/widgetStore';
import { useSettingsStore } from '../store/settingsStore';
import { recordNativeResize } from './perfDiagnostics';
import { orchestrateWidgets } from './widgetOrchestrator';

// All callers share this worker, including fullscreen evasion. No hook instance
// may independently restore mouse input while another transition hides PILL.
let pending: { resize: boolean } | null = null;
let worker: Promise<void> | null = null;
let collapseTimer: ReturnType<typeof setTimeout> | null = null;
let clients = 0;

export function cancelCollapse(): void {
  if (collapseTimer !== null) clearTimeout(collapseTimer);
  collapseTimer = null;
}

export function retainIslandCoordinator(): () => void {
  clients += 1;
  return () => {
    clients -= 1;
    if (clients === 0) cancelCollapse();
  };
}

export function getCollapsedState(): IslandState {
  const enabled = useSettingsStore.getState().settings.widgets;
  const active = useWidgetStore.getState().activeWidgets.filter((id) => enabled[id]);
  return active.length > 1 ? 'split' : active.length === 1 ? 'compact' : 'idle';
}

export function synchronizeIslandWindow(resize = false): Promise<void> {
  pending = { resize: resize || (pending?.resize ?? false) };
  if (worker) return worker;

  // Defer worker startup to ensure synchronous requests coalesce before IPC.
  worker = Promise.resolve().then(async () => {
    while (pending !== null) {
      const request = pending;
      pending = null;
      const snapshot = useIslandStore.getState();
      try {
        if (request.resize) {
          recordNativeResize();
          await invoke('resize_island', ISLAND_DIMENSIONS[snapshot.state]);
          // A new presentation must resize again; evasion-only requests need
          // only restore input policy after this in-flight resize completes.
          if (pending !== null) continue;
        }
        await invoke('set_click_through', {
          enabled: !isIslandVisible(snapshot.visible, snapshot.isEvasionActive),
        });
        if (pending !== null) continue;
        if (request.resize) await invoke('notify_state_change', { state: snapshot.state });
      } catch (error) {
        console.error('[Island] Failed to synchronize native window:', error);
      }
    }
  }).finally(() => {
    worker = null;
    if (pending !== null) return synchronizeIslandWindow();
  });
  return worker;
}

export function transitionIsland(newState: IslandState): Promise<void> {
  cancelCollapse();
  if (useIslandStore.getState().state === newState) return worker ?? Promise.resolve();
  if (newState === 'expanded' && useIslandStore.getState().selectedModule === null) {
    const enabled = useSettingsStore.getState().settings.widgets;
    const active = useWidgetStore.getState().activeWidgets.filter((id) => enabled[id]);
    useIslandStore.getState().selectModule(orchestrateWidgets(active).primary ?? 'calendar');
  }
  useIslandStore.getState().setState(newState);
  return synchronizeIslandWindow(true);
}

export function scheduleIslandCollapse(delayMs = 2000): void {
  cancelCollapse();
  collapseTimer = setTimeout(() => {
    collapseTimer = null;
    // Read live stores here: widgets/settings may change while the timer waits.
    if (!useIslandStore.getState().pinned) void transitionIsland(getCollapsedState());
  }, delayMs);
}
