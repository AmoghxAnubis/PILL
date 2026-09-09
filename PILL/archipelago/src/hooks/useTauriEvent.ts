import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { UnlistenFn } from '@tauri-apps/api/event';

import {
  recordMediaEvent,
  recordTelemetryEvent,
  recordTimerEvent,
} from '../lib/perfDiagnostics';

/**
 * Hook to listen for Tauri backend events.
 *
 * The hook:
 * - subscribes when the event name changes
 * - keeps the latest handler without resubscribing
 * - cleans up synchronously when possible
 * - handles the case where listen() resolves after unmount
 *
 * Performance instrumentation is attached at the event
 * boundary so every delivered telemetry/media/timer event
 * is counted without changing consumer behavior.
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
            switch (eventName) {
              case 'telemetry_update':
                recordTelemetryEvent();
                break;

              case 'media_update':
                recordMediaEvent();
                break;

              case 'timer_tick':
                recordTimerEvent();
                break;

              default:
                break;
            }

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