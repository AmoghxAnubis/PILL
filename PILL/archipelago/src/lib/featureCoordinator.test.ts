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
  it('activates media for media.started', () => {
    expect(
      getFeatureEventActions(
        FEATURE_EVENTS.MEDIA_STARTED,
      ),
    ).toEqual([
      {
        type: 'activate',
        widgetId: 'media',
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
        type: 'activate',
        widgetId: 'media',
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
        type: 'activate',
        widgetId: 'media',
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
        type: 'activate',
        widgetId: 'focusTimer',
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
        type: 'activate',
        widgetId: 'focusTimer',
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
        type: 'activate',
        widgetId: 'focusTimer',
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
        type: 'deactivate',
        widgetId: 'focusTimer',
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
        type: 'activate',
        widgetId: 'telemetry',
      },
    ]);
  });
});