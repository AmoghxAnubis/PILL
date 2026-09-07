import {
  FEATURE_EVENTS,
  type FeatureEventName,
} from './featureEvents';

import type { WidgetId } from '../store/widgetStore';

export type FeatureCoordinatorAction = {
  type: 'setActive';
  widgetId: WidgetId;
  active: boolean;
};

export function getFeatureEventActions(
  eventName: FeatureEventName,
): FeatureCoordinatorAction[] {
  switch (eventName) {
    case FEATURE_EVENTS.MEDIA_AVAILABLE:
      return [
        {
          type: 'setActive',
          widgetId: 'media',
          active: true,
        },
      ];

    case FEATURE_EVENTS.MEDIA_UNAVAILABLE:
      return [
        {
          type: 'setActive',
          widgetId: 'media',
          active: false,
        },
      ];

    case FEATURE_EVENTS.MEDIA_STARTED:
    case FEATURE_EVENTS.MEDIA_PAUSED:
    case FEATURE_EVENTS.MEDIA_CHANGED:
      return [
        {
          type: 'setActive',
          widgetId: 'media',
          active: true,
        },
      ];

    case FEATURE_EVENTS.FOCUS_TIMER_STARTED:
    case FEATURE_EVENTS.FOCUS_TIMER_PAUSED:
    case FEATURE_EVENTS.FOCUS_TIMER_COMPLETED:
      return [
        {
          type: 'setActive',
          widgetId: 'focusTimer',
          active: true,
        },
      ];

    case FEATURE_EVENTS.FOCUS_TIMER_RESET:
      return [
        {
          type: 'setActive',
          widgetId: 'focusTimer',
          active: false,
        },
      ];

    case FEATURE_EVENTS.TELEMETRY_WARNING:
      return [
        {
          type: 'setActive',
          widgetId: 'telemetry',
          active: true,
        },
      ];

    case FEATURE_EVENTS.TELEMETRY_NORMAL:
      return [
        {
          type: 'setActive',
          widgetId: 'telemetry',
          active: false,
        },
      ];

    default:
      return [];
  }
}