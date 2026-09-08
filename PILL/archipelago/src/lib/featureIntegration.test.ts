import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  FEATURE_EVENTS,
  clearFeatureEventListeners,
} from './featureEvents';

import {
  getFeatureEventActions,
} from './featureCoordinator';

import {
  orchestrateWidgets,
} from './widgetOrchestrator';

import {
  useWidgetStore,
} from '../store/widgetStore';

function resetWidgetStore() {
  useWidgetStore.setState({
    activeWidgets: [],
  });
}

function applyCoordinatorEvent(
  eventName:
    (typeof FEATURE_EVENTS)[keyof typeof FEATURE_EVENTS],
) {
  const actions =
    getFeatureEventActions(eventName);

  for (const action of actions) {
    useWidgetStore
      .getState()
      .setWidgetActive(
        action.widgetId,
        action.active,
      );
  }
}

beforeEach(() => {
  clearFeatureEventListeners();
  resetWidgetStore();
});

afterEach(() => {
  clearFeatureEventListeners();
  resetWidgetStore();
});

describe('feature integration', () => {
  it('activates media as a single widget', () => {
    applyCoordinatorEvent(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
    );

    const state =
      useWidgetStore.getState();

    expect(
      state.activeWidgets,
    ).toEqual(['media']);

    expect(
      orchestrateWidgets(
        state.activeWidgets,
      ),
    ).toEqual({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });
  });

  it('puts focus timer before media in split layout', () => {
    applyCoordinatorEvent(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
    );

    applyCoordinatorEvent(
      FEATURE_EVENTS.FOCUS_TIMER_STARTED,
    );

    const state =
      useWidgetStore.getState();

    expect(
      state.activeWidgets,
    ).toEqual([
      'media',
      'focusTimer',
    ]);

    expect(
      orchestrateWidgets(
        state.activeWidgets,
      ),
    ).toEqual({
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'media',
    });
  });

  it('puts media before telemetry in split layout', () => {
    applyCoordinatorEvent(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
    );

    applyCoordinatorEvent(
      FEATURE_EVENTS.TELEMETRY_WARNING,
    );

    const state =
      useWidgetStore.getState();

    expect(
      state.activeWidgets,
    ).toEqual([
      'media',
      'telemetry',
    ]);

    expect(
      orchestrateWidgets(
        state.activeWidgets,
      ),
    ).toEqual({
      layout: 'split',
      primary: 'media',
      secondary: 'telemetry',
    });
  });

  it('keeps focus timer as primary when all three features are active', () => {
    applyCoordinatorEvent(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
    );

    applyCoordinatorEvent(
      FEATURE_EVENTS.TELEMETRY_WARNING,
    );

    applyCoordinatorEvent(
      FEATURE_EVENTS.FOCUS_TIMER_STARTED,
    );

    const state =
      useWidgetStore.getState();

    expect(
      state.activeWidgets,
    ).toEqual([
      'media',
      'telemetry',
      'focusTimer',
    ]);

    expect(
      orchestrateWidgets(
        state.activeWidgets,
      ),
    ).toEqual({
      layout: 'split',
      primary: 'focusTimer',
      secondary: 'media',
    });
  });

  it('removes media without removing the focus timer', () => {
    applyCoordinatorEvent(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
    );

    applyCoordinatorEvent(
      FEATURE_EVENTS.FOCUS_TIMER_STARTED,
    );

    applyCoordinatorEvent(
      FEATURE_EVENTS.MEDIA_UNAVAILABLE,
    );

    const state =
      useWidgetStore.getState();

    expect(
      state.activeWidgets,
    ).toEqual(['focusTimer']);

    expect(
      orchestrateWidgets(
        state.activeWidgets,
      ),
    ).toEqual({
      layout: 'single',
      primary: 'focusTimer',
      secondary: null,
    });
  });

  it('removes telemetry without disturbing media', () => {
    applyCoordinatorEvent(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
    );

    applyCoordinatorEvent(
      FEATURE_EVENTS.TELEMETRY_WARNING,
    );

    applyCoordinatorEvent(
      FEATURE_EVENTS.TELEMETRY_NORMAL,
    );

    const state =
      useWidgetStore.getState();

    expect(
      state.activeWidgets,
    ).toEqual(['media']);

    expect(
      orchestrateWidgets(
        state.activeWidgets,
      ),
    ).toEqual({
      layout: 'single',
      primary: 'media',
      secondary: null,
    });
  });

  it('returns to no widgets when all features deactivate', () => {
    applyCoordinatorEvent(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
    );

    applyCoordinatorEvent(
      FEATURE_EVENTS.FOCUS_TIMER_STARTED,
    );

    applyCoordinatorEvent(
      FEATURE_EVENTS.TELEMETRY_WARNING,
    );

    applyCoordinatorEvent(
      FEATURE_EVENTS.MEDIA_UNAVAILABLE,
    );

    applyCoordinatorEvent(
      FEATURE_EVENTS.FOCUS_TIMER_RESET,
    );

    applyCoordinatorEvent(
      FEATURE_EVENTS.TELEMETRY_NORMAL,
    );

    const state =
      useWidgetStore.getState();

    expect(
      state.activeWidgets,
    ).toEqual([]);

    expect(
      orchestrateWidgets(
        state.activeWidgets,
      ),
    ).toEqual({
      layout: 'none',
      primary: null,
      secondary: null,
    });
  });

  it('does not duplicate a widget when the same activation happens repeatedly', () => {
    applyCoordinatorEvent(
      FEATURE_EVENTS.MEDIA_AVAILABLE,
    );

    applyCoordinatorEvent(
      FEATURE_EVENTS.MEDIA_STARTED,
    );

    applyCoordinatorEvent(
      FEATURE_EVENTS.MEDIA_CHANGED,
    );

    const state =
      useWidgetStore.getState();

    expect(
      state.activeWidgets,
    ).toEqual(['media']);
  });
});