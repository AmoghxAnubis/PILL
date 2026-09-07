import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useWidgetOrchestrator } from './useWidgetOrchestrator';
import { useWidgetStore } from '../store/widgetStore';

describe('useWidgetOrchestrator', () => {
  beforeEach(() => {
    useWidgetStore.getState().clearWidgets();
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

    expect(result.current.primary).toBe('focusTimer');

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
});