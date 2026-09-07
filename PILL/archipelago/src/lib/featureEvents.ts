export const FEATURE_EVENTS = {
  MEDIA_STARTED: 'media.started',
  MEDIA_PAUSED: 'media.paused',
  MEDIA_CHANGED: 'media.changed',

  FOCUS_TIMER_STARTED: 'focusTimer.started',
  FOCUS_TIMER_PAUSED: 'focusTimer.paused',
  FOCUS_TIMER_COMPLETED: 'focusTimer.completed',
  FOCUS_TIMER_RESET: 'focusTimer.reset',

  TELEMETRY_WARNING: 'telemetry.warning',
  TELEMETRY_NORMAL: 'telemetry.normal',
} as const;

export type FeatureEventName =
  (typeof FEATURE_EVENTS)[keyof typeof FEATURE_EVENTS];

export interface MediaStartedPayload {
  app_id: string;
  title: string;
  artist: string;
}

export interface MediaPausedPayload {
  app_id: string;
  title: string;
  artist: string;
}

export interface MediaChangedPayload {
  app_id: string;
  title: string;
  artist: string;
  is_playing: boolean;
}

export interface FocusTimerStartedPayload {
  seconds_remaining: number;
}

export interface FocusTimerPausedPayload {
  seconds_remaining: number;
}

export interface FocusTimerCompletedPayload {
  seconds_remaining: number;
}

export interface FocusTimerResetPayload {
  seconds_remaining: number;
}

export interface TelemetryWarningPayload {
  cpu_usage: number;
  ram_percentage: number;
}

export interface TelemetryNormalPayload {
  cpu_usage: number;
  ram_percentage: number;
}

export interface FeatureEventPayloads {
  [FEATURE_EVENTS.MEDIA_STARTED]: MediaStartedPayload;
  [FEATURE_EVENTS.MEDIA_PAUSED]: MediaPausedPayload;
  [FEATURE_EVENTS.MEDIA_CHANGED]: MediaChangedPayload;

  [FEATURE_EVENTS.FOCUS_TIMER_STARTED]:
    FocusTimerStartedPayload;
  [FEATURE_EVENTS.FOCUS_TIMER_PAUSED]:
    FocusTimerPausedPayload;
  [FEATURE_EVENTS.FOCUS_TIMER_COMPLETED]:
    FocusTimerCompletedPayload;
  [FEATURE_EVENTS.FOCUS_TIMER_RESET]:
    FocusTimerResetPayload;

  [FEATURE_EVENTS.TELEMETRY_WARNING]:
    TelemetryWarningPayload;
  [FEATURE_EVENTS.TELEMETRY_NORMAL]:
    TelemetryNormalPayload;
}

export type FeatureEventHandler<
  K extends FeatureEventName,
> = (
  payload: FeatureEventPayloads[K],
) => void;

type AnyFeatureEventHandler = (
  payload: unknown,
) => void;

const listeners = new Map<
  FeatureEventName,
  Set<AnyFeatureEventHandler>
>();

function getListeners(
  eventName: FeatureEventName,
): Set<AnyFeatureEventHandler> {
  let eventListeners =
    listeners.get(eventName);

  if (!eventListeners) {
    eventListeners =
      new Set<AnyFeatureEventHandler>();

    listeners.set(
      eventName,
      eventListeners,
    );
  }

  return eventListeners;
}

export function emitFeatureEvent<
  K extends FeatureEventName,
>(
  eventName: K,
  payload: FeatureEventPayloads[K],
): void {
  const eventListeners =
    listeners.get(eventName);

  if (!eventListeners) {
    return;
  }

  for (const handler of eventListeners) {
    handler(payload);
  }
}

export function subscribeToFeatureEvent<
  K extends FeatureEventName,
>(
  eventName: K,
  handler: FeatureEventHandler<K>,
): () => void {
  const eventListeners =
    getListeners(eventName);

  const typedHandler =
    handler as unknown as AnyFeatureEventHandler;

  eventListeners.add(typedHandler);

  return () => {
    eventListeners.delete(typedHandler);

    if (eventListeners.size === 0) {
      listeners.delete(eventName);
    }
  };
}

export function clearFeatureEventListeners(): void {
  listeners.clear();
}
it('supports telemetry.normal events', () => {
  const handler = vi.fn();

  subscribeToFeatureEvent(
    FEATURE_EVENTS.TELEMETRY_NORMAL,
    handler,
  );

  emitFeatureEvent(
    FEATURE_EVENTS.TELEMETRY_NORMAL,
    {
      cpu_usage: 62,
      ram_percentage: 58,
    },
  );

  expect(handler).toHaveBeenCalledTimes(1);

  expect(handler).toHaveBeenCalledWith({
    cpu_usage: 62,
    ram_percentage: 58,
  });
});