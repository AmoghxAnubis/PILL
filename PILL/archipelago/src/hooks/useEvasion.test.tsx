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

import {
  DEFAULT_PILL_SETTINGS,
} from '../../../shared/settings/PillSettings';

import {
  useIslandStore,
} from '../store/islandStore';

import {
  useSettingsStore,
} from '../store/settingsStore';

import {
  useEvasion,
} from './useEvasion';

import {
  TAURI_EVENTS,
  useTauriTypedEvent,
} from '../lib/tauriEvents';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/tauriEvents', () => ({
  TAURI_EVENTS: {
    FULLSCREEN_STATE_CHANGED:
      'fullscreen_state_changed',
  },
  useTauriTypedEvent: vi.fn(),
}));

type FullscreenPayload = {
  active: boolean;
};

type FullscreenHandler = (
  payload: FullscreenPayload,
) => void | Promise<void>;

const mockedInvoke =
  vi.mocked(invoke);

const mockedUseTauriTypedEvent =
  vi.mocked(useTauriTypedEvent);

describe('useEvasion', () => {
  let fullscreenHandler:
    | FullscreenHandler
    | undefined;

  beforeEach(() => {
    useIslandStore.setState({
      isEvasionActive: false,
    });

    useSettingsStore.setState({
      settings: DEFAULT_PILL_SETTINGS,
    });

    fullscreenHandler = undefined;

    mockedInvoke.mockReset();
    mockedInvoke.mockResolvedValue(undefined);

    mockedUseTauriTypedEvent.mockReset();

    mockedUseTauriTypedEvent.mockImplementation(
      ((
        _eventName: string,
        handler: FullscreenHandler,
      ) => {
        fullscreenHandler = handler;
      }) as typeof useTauriTypedEvent,
    );
  });

  it('registers the fullscreen state listener', () => {
    renderHook(() => useEvasion());

    expect(
      mockedUseTauriTypedEvent,
    ).toHaveBeenCalledWith(
      TAURI_EVENTS.FULLSCREEN_STATE_CHANGED,
      expect.any(Function),
    );

    expect(
      fullscreenHandler,
    ).toBeDefined();
  });

  it('enters evasion when fullscreen becomes active and evasion is enabled', async () => {
    renderHook(() => useEvasion());

    await act(async () => {
      await fullscreenHandler?.({
        active: true,
      });
    });

    expect(
      useIslandStore.getState()
        .isEvasionActive,
    ).toBe(true);

    expect(
      mockedInvoke,
    ).toHaveBeenCalledWith(
      'set_click_through',
      {
        enabled: true,
      },
    );
  });

  it('does not enter evasion when fullscreen evasion is disabled', async () => {
    useSettingsStore.setState({
      settings: {
        ...DEFAULT_PILL_SETTINGS,
        behavior: {
          ...DEFAULT_PILL_SETTINGS.behavior,
          fullscreenEvasion: false,
        },
      },
    });

    renderHook(() => useEvasion());

    await act(async () => {
      await fullscreenHandler?.({
        active: true,
      });
    });

    expect(
      useIslandStore.getState()
        .isEvasionActive,
    ).toBe(false);

    expect(
      mockedInvoke,
    ).toHaveBeenCalledWith(
      'set_click_through',
      {
        enabled: false,
      },
    );
  });

  it('exits evasion when fullscreen becomes inactive', async () => {
    renderHook(() => useEvasion());

    await act(async () => {
      await fullscreenHandler?.({
        active: true,
      });
    });

    expect(
      useIslandStore.getState()
        .isEvasionActive,
    ).toBe(true);

    await act(async () => {
      await fullscreenHandler?.({
        active: false,
      });
    });

    expect(
      useIslandStore.getState()
        .isEvasionActive,
    ).toBe(false);

    expect(
      mockedInvoke,
    ).toHaveBeenLastCalledWith(
      'set_click_through',
      {
        enabled: false,
      },
    );
  });

  it('applies a live fullscreen evasion setting change while fullscreen is active', async () => {
    renderHook(() => useEvasion());

    await act(async () => {
      await fullscreenHandler?.({
        active: true,
      });
    });

    expect(
      useIslandStore.getState()
        .isEvasionActive,
    ).toBe(true);

    act(() => {
      useSettingsStore.setState({
        settings: {
          ...DEFAULT_PILL_SETTINGS,
          behavior: {
            ...DEFAULT_PILL_SETTINGS.behavior,
            fullscreenEvasion: false,
          },
        },
      });
    });

    expect(
      useIslandStore.getState()
        .isEvasionActive,
    ).toBe(false);

    expect(
      mockedInvoke,
    ).toHaveBeenLastCalledWith(
      'set_click_through',
      {
        enabled: false,
      },
    );
  });

  it('re-enters evasion when the setting is re-enabled during fullscreen', async () => {
    useSettingsStore.setState({
      settings: {
        ...DEFAULT_PILL_SETTINGS,
        behavior: {
          ...DEFAULT_PILL_SETTINGS.behavior,
          fullscreenEvasion: false,
        },
      },
    });

    renderHook(() => useEvasion());

    await act(async () => {
      await fullscreenHandler?.({
        active: true,
      });
    });

    expect(
      useIslandStore.getState()
        .isEvasionActive,
    ).toBe(false);

    act(() => {
      useSettingsStore.setState({
        settings: {
          ...DEFAULT_PILL_SETTINGS,
          behavior: {
            ...DEFAULT_PILL_SETTINGS.behavior,
            fullscreenEvasion: true,
          },
        },
      });
    });

    expect(
      useIslandStore.getState()
        .isEvasionActive,
    ).toBe(true);

    expect(
      mockedInvoke,
    ).toHaveBeenLastCalledWith(
      'set_click_through',
      {
        enabled: true,
      },
    );
  });
});