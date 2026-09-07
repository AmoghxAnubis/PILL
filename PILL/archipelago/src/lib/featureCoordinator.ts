import {
  FEATURE_EVENTS,
  type FeatureEventName,
} from './featureEvents';

import type { WidgetId } from '../store/widgetStore';

export type FeatureCoordinatorAction =
  | {
      type: 'activate';
      widgetId: WidgetId;
    }
  | {
      type: 'deactivate';
      widgetId: WidgetId;
    };

/**
 * Defines the application-level response to a feature event.
 *
 * This function contains policy only. It does not mutate Zustand
 * or interact with React. The hook layer is responsible for
 * executing the returned actions.
 */
export function getFeatureEventActions(
  eventName: FeatureEventName,
): FeatureCoordinatorAction[] {
  switch (eventName) {
    case FEATURE_EVENTS.MEDIA_STARTED:
    case FEATURE_EVENTS.MEDIA_PAUSED:
    case FEATURE_EVENTS.MEDIA_CHANGED:
      return [
        {
          type: 'activate',
          widgetId: 'media',
        },
      ];

    case FEATURE_EVENTS.FOCUS_TIMER_STARTED:
    case FEATURE_EVENTS.FOCUS_TIMER_PAUSED:
    case FEATURE_EVENTS.FOCUS_TIMER_COMPLETED:
      return [
        {
          type: 'activate',
          widgetId: 'focusTimer',
        },
      ];

    case FEATURE_EVENTS.FOCUS_TIMER_RESET:
      return [
        {
          type: 'deactivate',
          widgetId: 'focusTimer',
        },
      ];

    case FEATURE_EVENTS.TELEMETRY_WARNING:
      return [
        {
          type: 'activate',
          widgetId: 'telemetry',
        },
      ];

    default:
      return [];
  }
}