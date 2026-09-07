import { useCallback } from 'react';

import {
  FEATURE_EVENTS,
  type FeatureEventName,
} from '../lib/featureEvents';

import {
  getFeatureEventActions,
} from '../lib/featureCoordinator';

import { useFeatureEvent } from './useFeatureEvent';

import {
  useWidgetStore,
} from '../store/widgetStore';

export function useFeatureCoordinator(): void {
  const setWidgetActive = useWidgetStore(
    (state) => state.setWidgetActive,
  );

  const applyEventActions = useCallback(
    (eventName: FeatureEventName) => {
      const actions =
        getFeatureEventActions(eventName);

      for (const action of actions) {
        setWidgetActive(
          action.widgetId,
          action.active,
        );
      }
    },
    [setWidgetActive],
  );

  useFeatureEvent(
    FEATURE_EVENTS.MEDIA_AVAILABLE,
    () => {
      applyEventActions(
        FEATURE_EVENTS.MEDIA_AVAILABLE,
      );
    },
  );

  useFeatureEvent(
    FEATURE_EVENTS.MEDIA_UNAVAILABLE,
    () => {
      applyEventActions(
        FEATURE_EVENTS.MEDIA_UNAVAILABLE,
      );
    },
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

  useFeatureEvent(
    FEATURE_EVENTS.TELEMETRY_NORMAL,
    () => {
      applyEventActions(
        FEATURE_EVENTS.TELEMETRY_NORMAL,
      );
    },
  );
}