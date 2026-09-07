import { beforeEach, describe, expect, it } from 'vitest';
import {
  useWidgetStore,
  type WidgetId,
} from './widgetStore';

describe('widgetStore', () => {
  beforeEach(() => {
    useWidgetStore.getState().clearWidgets();
  });

  it('starts with no active widgets', () => {
    expect(
      useWidgetStore.getState().activeWidgets,
    ).toEqual([]);
  });

  it('activates a widget', () => {
    useWidgetStore
      .getState()
      .activateWidget('media');

    expect(
      useWidgetStore.getState().activeWidgets,
    ).toEqual(['media']);
  });

  it('does not add the same widget twice', () => {
    useWidgetStore
      .getState()
      .activateWidget('media');

    useWidgetStore
      .getState()
      .activateWidget('media');

    expect(
      useWidgetStore.getState().activeWidgets,
    ).toEqual(['media']);
  });

  it('supports multiple active widgets', () => {
    useWidgetStore
      .getState()
      .activateWidget('media');

    useWidgetStore
      .getState()
      .activateWidget('focusTimer');

    expect(
      useWidgetStore.getState().activeWidgets,
    ).toEqual([
      'media',
      'focusTimer',
    ]);
  });

  it('deactivates a widget', () => {
    useWidgetStore
      .getState()
      .activateWidget('media');

    useWidgetStore
      .getState()
      .deactivateWidget('media');

    expect(
      useWidgetStore.getState().activeWidgets,
    ).toEqual([]);
  });

  it('reports whether a widget is active', () => {
    useWidgetStore
      .getState()
      .activateWidget('telemetry');

    expect(
      useWidgetStore
        .getState()
        .isWidgetActive('telemetry'),
    ).toBe(true);

    expect(
      useWidgetStore
        .getState()
        .isWidgetActive('media'),
    ).toBe(false);
  });

  it('toggles widgets on and off', () => {
    const widget: WidgetId = 'focusTimer';

    useWidgetStore
      .getState()
      .toggleWidget(widget);

    expect(
      useWidgetStore.getState().isWidgetActive(widget),
    ).toBe(true);

    useWidgetStore
      .getState()
      .toggleWidget(widget);

    expect(
      useWidgetStore.getState().isWidgetActive(widget),
    ).toBe(false);
  });

  it('clears all active widgets', () => {
    useWidgetStore
      .getState()
      .activateWidget('media');

    useWidgetStore
      .getState()
      .activateWidget('focusTimer');

    useWidgetStore
      .getState()
      .activateWidget('telemetry');

    useWidgetStore.getState().clearWidgets();

    expect(
      useWidgetStore.getState().activeWidgets,
    ).toEqual([]);
  });
});