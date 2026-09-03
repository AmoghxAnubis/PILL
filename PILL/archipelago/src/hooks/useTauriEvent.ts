import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { UnlistenFn } from '@tauri-apps/api/event';

/**
 * Hook to listen for Tauri backend events.
 *
 * The hook:
 * - subscribes when the event name changes
 * - keeps the latest handler without resubscribing
 * - cleans up synchronously when possible
 * - handles the case where listen() resolves after unmount
 */
export function useTauriEvent<T>(
  eventName: string,
  handler: (payload: T) => void,
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    let cancelled = false;
    let unlisten: UnlistenFn | undefined;

    const registerListener = async () => {
      try {
        const cleanup = await listen<T>(
          eventName,
          (event) => {
            handlerRef.current(event.payload);
          },
        );

        if (cancelled) {
          cleanup();
          return;
        }

        unlisten = cleanup;
      } catch (error) {
        console.error(
          `[Tauri] Failed to listen for ${eventName}:`,
          error,
        );
      }
    };

    void registerListener();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [eventName]);
}