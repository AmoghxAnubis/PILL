import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  orchestrateWidgets,
} from './widgetOrchestrator';

type TestWidgetId =
  | 'telemetry'
  | 'media'
  | 'focusTimer';

describe('widgetOrchestrator', () => {
  it('returns none when no widgets are active', () => {
    expect(
      orchestrateWidgets([]),
    ).toEqual({
      layout: 'none',
      primary: null,
      secondary: null,
    });
  });

  it('uses single layout for one widget', () => {
    expect(
      orchestrateWidgets(['media']),
    ).toEqual({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });
  });

  it('uses single layout for a focus timer alone', () => {
    expect(
      orchestrateWidgets([
        'focusTimer',
      ]),
    ).toEqual({
      layout: 'single',
      primary: 'focusTimer',
      secondary: null,
    });
  });

  it('uses single layout for telemetry alone', () => {
    expect(
      orchestrateWidgets([
        'telemetry',
      ]),
    ).toEqual({
      layout: 'single',
      primary: 'telemetry',
      secondary: null,
    });
  });

  it('prioritizes focus timer over media', () => {
    expect(
      orchestrateWidgets([
        'media',
        'focusTimer',
      ]),
    ).toEqual({
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'media',
    });
  });

  it('prioritizes media over telemetry', () => {
    expect(
      orchestrateWidgets([
        'telemetry',
        'media',
      ]),
    ).toEqual({
      layout: 'split',
      primary: 'media',
      secondary: 'telemetry',
    });
  });

  it('prioritizes focus timer over telemetry', () => {
    expect(
      orchestrateWidgets([
        'telemetry',
        'focusTimer',
      ]),
    ).toEqual({
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'telemetry',
    });
  });

  it('handles all active widgets by priority', () => {
    expect(
      orchestrateWidgets([
        'telemetry',
        'media',
        'focusTimer',
      ]),
    ).toEqual({
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'media',
    });
  });

  it('keeps the focus timer primary regardless of input order', () => {
    const expected = {
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'media',
    };

    expect(
      orchestrateWidgets([
        'focusTimer',
        'media',
      ]),
    ).toEqual(expected);

    expect(
      orchestrateWidgets([
        'media',
        'focusTimer',
      ]),
    ).toEqual(expected);
  });

  it('keeps media primary over telemetry regardless of input order', () => {
    const expected = {
      layout: 'split',
      primary: 'media',
      secondary: 'telemetry',
    };

    expect(
      orchestrateWidgets([
        'media',
        'telemetry',
      ]),
    ).toEqual(expected);

    expect(
      orchestrateWidgets([
        'telemetry',
        'media',
      ]),
    ).toEqual(expected);
  });

  it('keeps focus timer primary over telemetry regardless of input order', () => {
    const expected = {
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'telemetry',
    };

    expect(
      orchestrateWidgets([
        'focusTimer',
        'telemetry',
      ]),
    ).toEqual(expected);

    expect(
      orchestrateWidgets([
        'telemetry',
        'focusTimer',
      ]),
    ).toEqual(expected);
  });

  it('handles media + focus timer + telemetry in every input order', () => {
    const expected = {
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'media',
    };

    expect(
      orchestrateWidgets([
        'media',
        'focusTimer',
        'telemetry',
      ]),
    ).toEqual(expected);

    expect(
      orchestrateWidgets([
        'media',
        'telemetry',
        'focusTimer',
      ]),
    ).toEqual(expected);

    expect(
      orchestrateWidgets([
        'focusTimer',
        'media',
        'telemetry',
      ]),
    ).toEqual(expected);

    expect(
      orchestrateWidgets([
        'focusTimer',
        'telemetry',
        'media',
      ]),
    ).toEqual(expected);

    expect(
      orchestrateWidgets([
        'telemetry',
        'media',
        'focusTimer',
      ]),
    ).toEqual(expected);

    expect(
      orchestrateWidgets([
        'telemetry',
        'focusTimer',
        'media',
      ]),
    ).toEqual(expected);
  });

  it('removes duplicate widgets', () => {
    expect(
      orchestrateWidgets([
        'media',
        'media',
      ]),
    ).toEqual({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });
  });

  it('removes duplicate widgets without changing priority', () => {
    expect(
      orchestrateWidgets([
        'focusTimer',
        'media',
        'focusTimer',
        'media',
      ]),
    ).toEqual({
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'media',
    });
  });

  it('does not mutate the input array', () => {
    const widgets = [
      'telemetry',
      'media',
      'focusTimer',
    ] as const;

    orchestrateWidgets([...widgets]);

    expect(widgets).toEqual([
      'telemetry',
      'media',
      'focusTimer',
    ]);
  });

  it('does not mutate a mutable input array', () => {
    const widgets: TestWidgetId[] = [
      'telemetry',
      'media',
      'focusTimer',
    ];

    const original = [...widgets];

    orchestrateWidgets(widgets);

    expect(widgets).toEqual(original);
  });
});