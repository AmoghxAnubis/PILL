import {
  act,
  renderHook,
} from '@testing-library/react';

import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  DEFAULT_PILL_SETTINGS,
  type PillSettings,
} from '../../../shared/settings/PillSettings';

import { useWidgetOrchestrator } from './useWidgetOrchestrator';

import { useWidgetStore } from '../store/widgetStore';

import { useSettingsStore } from '../store/settingsStore';

describe('useWidgetOrchestrator', () => {
  beforeEach(() => {
    useWidgetStore.getState().clearWidgets();

    useSettingsStore.setState({
      settings: DEFAULT_PILL_SETTINGS,
    });
  });

  it('returns none when there are no active widgets', () => {
    const { result } = renderHook(
      () => useWidgetOrchestrator(),
    );

    expect(result.current).toEqual({
      layout: 'none',
      primary: null,
      secondary: null,
    });
  });

  it('returns a single media widget', () => {
    act(() => {
      useWidgetStore
        .getState()
        .activateWidget('media');
    });

    const { result } = renderHook(
      () => useWidgetOrchestrator(),
    );

    expect(result.current).toEqual({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });
  });

  it('prioritizes focus timer over media', () => {
    act(() => {
      useWidgetStore
        .getState()
        .activateWidget('media');

      useWidgetStore
        .getState()
        .activateWidget('focusTimer');
    });

    const { result } = renderHook(
      () => useWidgetOrchestrator(),
    );

    expect(result.current).toEqual({
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'media',
    });
  });

  it('reacts when active widgets change', () => {
    const { result } = renderHook(
      () => useWidgetOrchestrator(),
    );

    expect(result.current.layout).toBe('none');

    act(() => {
      useWidgetStore
        .getState()
        .activateWidget('telemetry');
    });

    expect(result.current).toEqual({
      layout: 'single',
      primary: 'telemetry',
      secondary: null,
    });

    act(() => {
      useWidgetStore
        .getState()
        .activateWidget('media');
    });

    expect(result.current).toEqual({
      layout: 'split',
      primary: 'media',
      secondary: 'telemetry',
    });
  });

  it('updates when a widget is removed', () => {
    act(() => {
      useWidgetStore
        .getState()
        .activateWidget('media');

      useWidgetStore
        .getState()
        .activateWidget('focusTimer');
    });

    const { result } = renderHook(
      () => useWidgetOrchestrator(),
    );

    expect(result.current.primary).toBe(
      'focusTimer',
    );

    act(() => {
      useWidgetStore
        .getState()
        .deactivateWidget('focusTimer');
    });

    expect(result.current).toEqual({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });
  });

  it('filters out a disabled widget', () => {
    act(() => {
      useWidgetStore
        .getState()
        .activateWidget('telemetry');

      useSettingsStore.getState().setSettings({
        ...DEFAULT_PILL_SETTINGS,
        widgets: {
          ...DEFAULT_PILL_SETTINGS.widgets,
          telemetry: false,
        },
      });
    });

    const { result } = renderHook(
      () => useWidgetOrchestrator(),
    );

    expect(result.current).toEqual({
      layout: 'none',
      primary: null,
      secondary: null,
    });
  });

  it('removes a disabled higher-priority widget from orchestration', () => {
    act(() => {
      useWidgetStore
        .getState()
        .activateWidget('media');

      useWidgetStore
        .getState()
        .activateWidget('focusTimer');

      useSettingsStore.getState().setSettings({
        ...DEFAULT_PILL_SETTINGS,
        widgets: {
          ...DEFAULT_PILL_SETTINGS.widgets,
          focusTimer: false,
        },
      });
    });

    const { result } = renderHook(
      () => useWidgetOrchestrator(),
    );

    expect(result.current).toEqual({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });
  });

  it('reacts to live widget setting changes', () => {
    act(() => {
      useWidgetStore
        .getState()
        .activateWidget('media');

      useWidgetStore
        .getState()
        .activateWidget('telemetry');
    });

    const { result } = renderHook(
      () => useWidgetOrchestrator(),
    );

    expect(result.current).toEqual({
      layout: 'split',
      primary: 'media',
      secondary: 'telemetry',
    });

    const settingsWithoutMedia: PillSettings = {
      ...DEFAULT_PILL_SETTINGS,
      widgets: {
        ...DEFAULT_PILL_SETTINGS.widgets,
        media: false,
      },
    };

    act(() => {
      useSettingsStore
        .getState()
        .setSettings(settingsWithoutMedia);
    });

    expect(result.current).toEqual({
      layout: 'single',
      primary: 'telemetry',
      secondary: null,
    });

    const allWidgetsDisabled: PillSettings = {
      ...settingsWithoutMedia,
      widgets: {
        ...settingsWithoutMedia.widgets,
        telemetry: false,
      },
    };

    act(() => {
      useSettingsStore
        .getState()
        .setSettings(allWidgetsDisabled);
    });

    expect(result.current).toEqual({
      layout: 'none',
      primary: null,
      secondary: null,
    });
  });
});