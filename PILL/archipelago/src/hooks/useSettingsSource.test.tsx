import {
  act,
  renderHook,
} from '@testing-library/react';

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import {
  DEFAULT_PILL_SETTINGS,
  type PillSettings,
} from '../../../shared/settings/PillSettings';

import { useSettingsStore } from '../store/settingsStore';

import { useSettingsSource } from './useSettingsSource';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

const mockedInvoke = vi.mocked(invoke);
const mockedListen = vi.mocked(listen);

interface SettingsChangedEvent {
  payload: PillSettings;
}

type SettingsListener = (
  event: SettingsChangedEvent,
) => void;

describe('useSettingsSource', () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
    mockedListen.mockReset();

    useSettingsStore.setState({
      settings: DEFAULT_PILL_SETTINGS,
    });
  });

  it('loads settings on startup', async () => {
    const settings: PillSettings = {
      ...DEFAULT_PILL_SETTINGS,
      widgets: {
        ...DEFAULT_PILL_SETTINGS.widgets,
        telemetry: false,
      },
    };

    mockedInvoke.mockResolvedValueOnce(
      settings,
    );

    mockedListen.mockResolvedValueOnce(
      () => {},
    );

    renderHook(() =>
      useSettingsSource(),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedInvoke).toHaveBeenCalledWith(
      'load_settings',
    );

    expect(mockedListen).toHaveBeenCalledWith(
      'settings_changed',
      expect.any(Function),
    );

    expect(
      useSettingsStore.getState()
        .settings.widgets.telemetry,
    ).toBe(false);
  });

  it('applies live settings changes', async () => {
    let handler:
      | SettingsListener
      | undefined;

    mockedInvoke.mockResolvedValueOnce(
      DEFAULT_PILL_SETTINGS,
    );

    mockedListen.mockImplementationOnce(
      (async (
        _eventName: string,
        callback: SettingsListener,
      ) => {
        handler = callback;

        return () => {};
      }) as typeof listen,
    );

    renderHook(() =>
      useSettingsSource(),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(handler).toBeDefined();

    const nextSettings: PillSettings = {
      ...DEFAULT_PILL_SETTINGS,
      widgets: {
        ...DEFAULT_PILL_SETTINGS.widgets,
        telemetry: false,
      },
    };

    act(() => {
      handler?.({
        payload: nextSettings,
      });
    });

    expect(
      useSettingsStore.getState()
        .settings.widgets.telemetry,
    ).toBe(false);
  });
});