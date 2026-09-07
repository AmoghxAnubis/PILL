import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  FEATURE_EVENTS,
} from './featureEvents';

import {
  getFeatureEventActions,
} from './featureCoordinator';

describe('featureCoordinator', () => {
  it('activates media when media becomes available', () => {
    expect(
      getFeatureEventActions(
        FEATURE_EVENTS.MEDIA_AVAILABLE,
      ),
    ).toEqual([
      {
        type: 'setActive',
        widgetId: 'media',
        active: true,
      },
    ]);
  });

  it('deactivates media when media becomes unavailable', () => {
    expect(
      getFeatureEventActions(
        FEATURE_EVENTS.MEDIA_UNAVAILABLE,
      ),
    ).toEqual([
      {
        type: 'setActive',
        widgetId: 'media',
        active: false,
      },
    ]);
  });

  it('activates media for media.started', () => {
    expect(
      getFeatureEventActions(
        FEATURE_EVENTS.MEDIA_STARTED,
      ),
    ).toEqual([
      {
        type: 'setActive',
        widgetId: 'media',
        active: true,
      },
    ]);
  });

  it('activates media for media.paused', () => {
    expect(
      getFeatureEventActions(
        FEATURE_EVENTS.MEDIA_PAUSED,
      ),
    ).toEqual([
      {
        type: 'setActive',
        widgetId: 'media',
        active: true,
      },
    ]);
  });

  it('activates media for media.changed', () => {
    expect(
      getFeatureEventActions(
        FEATURE_EVENTS.MEDIA_CHANGED,
      ),
    ).toEqual([
      {
        type: 'setActive',
        widgetId: 'media',
        active: true,
      },
    ]);
  });

  it('activates focus timer for focusTimer.started', () => {
    expect(
      getFeatureEventActions(
        FEATURE_EVENTS.FOCUS_TIMER_STARTED,
      ),
    ).toEqual([
      {
        type: 'setActive',
        widgetId: 'focusTimer',
        active: true,
      },
    ]);
  });

  it('activates focus timer for focusTimer.paused', () => {
    expect(
      getFeatureEventActions(
        FEATURE_EVENTS.FOCUS_TIMER_PAUSED,
      ),
    ).toEqual([
      {
        type: 'setActive',
        widgetId: 'focusTimer',
        active: true,
      },
    ]);
  });

  it('activates focus timer for focusTimer.completed', () => {
    expect(
      getFeatureEventActions(
        FEATURE_EVENTS.FOCUS_TIMER_COMPLETED,
      ),
    ).toEqual([
      {
        type: 'setActive',
        widgetId: 'focusTimer',
        active: true,
      },
    ]);
  });

  it('deactivates focus timer on reset', () => {
    expect(
      getFeatureEventActions(
        FEATURE_EVENTS.FOCUS_TIMER_RESET,
      ),
    ).toEqual([
      {
        type: 'setActive',
        widgetId: 'focusTimer',
        active: false,
      },
    ]);
  });

  it('activates telemetry on warning', () => {
    expect(
      getFeatureEventActions(
        FEATURE_EVENTS.TELEMETRY_WARNING,
      ),
    ).toEqual([
      {
        type: 'setActive',
        widgetId: 'telemetry',
        active: true,
      },
    ]);
  });

  it('deactivates telemetry when warning clears', () => {
    expect(
      getFeatureEventActions(
        FEATURE_EVENTS.TELEMETRY_NORMAL,
      ),
    ).toEqual([
      {
        type: 'setActive',
        widgetId: 'telemetry',
        active: false,
      },
    ]);
  });
});