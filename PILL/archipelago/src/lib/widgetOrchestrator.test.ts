import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  orchestrateWidgets,
} from './widgetOrchestrator';

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
});