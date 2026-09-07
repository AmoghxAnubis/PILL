import { useEffect, useRef } from 'react';

import {
  subscribeToFeatureEvent,
  type FeatureEventHandler,
  type FeatureEventName,
} from '../lib/featureEvents';

export function useFeatureEvent<
  K extends FeatureEventName,
>(
  eventName: K,
  handler: FeatureEventHandler<K>,
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const stableHandler: FeatureEventHandler<K> = (
      payload,
    ) => {
      handlerRef.current(payload);
    };

    return subscribeToFeatureEvent(
      eventName,
      stableHandler,
    );
  }, [eventName]);
}