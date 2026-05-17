import { useEffect, useCallback } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

/**
 * Hook to listen for Tauri backend events.
 * Automatically cleans up the listener on unmount.
 */
export function useTauriEvent<T>(eventName: string, handler: (payload: T) => void) {
  const stableHandler = useCallback(handler, [handler]);

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    listen<T>(eventName, (event) => {
      stableHandler(event.payload);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [eventName, stableHandler]);
}
