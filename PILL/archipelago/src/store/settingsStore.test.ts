import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  DEFAULT_PILL_SETTINGS,
} from '../../../shared/settings/PillSettings';

import {
  useSettingsStore,
} from './settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: DEFAULT_PILL_SETTINGS,
    });
  });

  it('starts with default settings', () => {
    expect(
      useSettingsStore.getState().settings,
    ).toEqual(DEFAULT_PILL_SETTINGS);
  });

  it('updates widget settings', () => {
    useSettingsStore
      .getState()
      .updateWidgets({
        telemetry: false,
      });

    expect(
      useSettingsStore.getState().settings.widgets,
    ).toEqual({
      media: true,
      telemetry: false,
      focusTimer: true,
    });
  });

  it('updates behavior settings without removing other values', () => {
    useSettingsStore
      .getState()
      .updateBehavior({
        hoverToExpand: false,
      });

    expect(
      useSettingsStore.getState().settings.behavior,
    ).toEqual({
      ...DEFAULT_PILL_SETTINGS.behavior,
      hoverToExpand: false,
    });
  });

  it('updates appearance settings', () => {
    useSettingsStore
      .getState()
      .updateAppearance({
        animations: false,
      });

    expect(
      useSettingsStore.getState().settings.appearance
        .animations,
    ).toBe(false);
  });

  it('updates system settings', () => {
    useSettingsStore
      .getState()
      .updateSystem({
        launchAtStartup: true,
      });

    expect(
      useSettingsStore.getState().settings.system
        .launchAtStartup,
    ).toBe(true);
  });

  it('replaces the complete settings object', () => {
    const nextSettings = {
      ...DEFAULT_PILL_SETTINGS,
      widgets: {
        ...DEFAULT_PILL_SETTINGS.widgets,
        telemetry: false,
      },
    };

    useSettingsStore
      .getState()
      .setSettings(nextSettings);

    expect(
      useSettingsStore.getState().settings,
    ).toEqual(nextSettings);
  });

  it('resets settings to defaults', () => {
    useSettingsStore
      .getState()
      .updateWidgets({
        telemetry: false,
        media: false,
      });

    useSettingsStore
      .getState()
      .resetSettings();

    expect(
      useSettingsStore.getState().settings,
    ).toEqual(DEFAULT_PILL_SETTINGS);
  });
});