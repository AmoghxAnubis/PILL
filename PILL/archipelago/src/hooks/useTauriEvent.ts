import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { UnlistenFn } from '@tauri-apps/api/event';

/**
 * Hook to listen for Tauri backend events.
 * Automatically cleans up the listener on unmount and keeps the latest
 * handler without resubscribing on every render.
 */
export function useTauriEvent<T>(eventName: string, handler: (payload: T) => void) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    let cancelled = false;
    let unlisten: UnlistenFn | undefined;

    listen<T>(eventName, (event) => {
      handlerRef.current(event.payload);
    })
      .then((fn) => {
        if (cancelled) {
          fn();
        } else {
          unlisten = fn;
        }
      })
      .catch((error) => {
        console.error(`[Tauri] Failed to listen for ${eventName}:`, error);
      });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [eventName]);
}
