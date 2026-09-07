import { useCallback } from 'react';

import {
  FEATURE_EVENTS,
} from '../lib/featureEvents';

import {
  getFeatureEventActions,
} from '../lib/featureCoordinator';

import { useFeatureEvent } from './useFeatureEvent';

import {
  useWidgetStore,
} from '../store/widgetStore';

export function useFeatureCoordinator(): void {
  const activateWidget = useWidgetStore(
    (state) => state.activateWidget,
  );

  const deactivateWidget = useWidgetStore(
    (state) => state.deactivateWidget,
  );

  const applyEventActions = useCallback(
    (eventName: Parameters<
      typeof getFeatureEventActions
    >[0]) => {
      const actions =
        getFeatureEventActions(eventName);

      for (const action of actions) {
        if (action.type === 'activate') {
          activateWidget(action.widgetId);
        } else {
          deactivateWidget(action.widgetId);
        }
      }
    },
    [activateWidget, deactivateWidget],
  );

  useFeatureEvent(
    FEATURE_EVENTS.MEDIA_STARTED,
    () => {
      applyEventActions(
        FEATURE_EVENTS.MEDIA_STARTED,
      );
    },
  );

  useFeatureEvent(
    FEATURE_EVENTS.MEDIA_PAUSED,
    () => {
      applyEventActions(
        FEATURE_EVENTS.MEDIA_PAUSED,
      );
    },
  );

  useFeatureEvent(
    FEATURE_EVENTS.MEDIA_CHANGED,
    () => {
      applyEventActions(
        FEATURE_EVENTS.MEDIA_CHANGED,
      );
    },
  );

  useFeatureEvent(
    FEATURE_EVENTS.FOCUS_TIMER_STARTED,
    () => {
      applyEventActions(
        FEATURE_EVENTS.FOCUS_TIMER_STARTED,
      );
    },
  );

  useFeatureEvent(
    FEATURE_EVENTS.FOCUS_TIMER_PAUSED,
    () => {
      applyEventActions(
        FEATURE_EVENTS.FOCUS_TIMER_PAUSED,
      );
    },
  );

  useFeatureEvent(
    FEATURE_EVENTS.FOCUS_TIMER_COMPLETED,
    () => {
      applyEventActions(
        FEATURE_EVENTS.FOCUS_TIMER_COMPLETED,
      );
    },
  );

  useFeatureEvent(
    FEATURE_EVENTS.FOCUS_TIMER_RESET,
    () => {
      applyEventActions(
        FEATURE_EVENTS.FOCUS_TIMER_RESET,
      );
    },
  );

  useFeatureEvent(
    FEATURE_EVENTS.TELEMETRY_WARNING,
    () => {
      applyEventActions(
        FEATURE_EVENTS.TELEMETRY_WARNING,
      );
    },
  );
}