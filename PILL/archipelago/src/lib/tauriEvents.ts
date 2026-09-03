import { useTauriEvent } from '../hooks/useTauriEvent';

/**
 * Canonical Tauri event names.
 *
 * These must stay synchronized with the Rust event constants in
 * src-tauri/src/events.rs.
 */
export const TAURI_EVENTS = {
  FULLSCREEN_STATE_CHANGED: 'fullscreen_state_changed',
  TELEMETRY_UPDATE: 'telemetry_update',
  MEDIA_UPDATE: 'media_update',
  TIMER_TICK: 'timer_tick',
} as const;

/**
 * Payload emitted by the fullscreen/evasion subsystem.
 */
export interface FullscreenStateChanged {
  active: boolean;
}

/**
 * Payload emitted by the hardware telemetry subsystem.
 */
export interface TelemetryUpdate {
  cpu_usage: number;
  ram_allocated_mb: number;
  ram_percentage: number;
}

/**
 * Payload emitted by the Windows SMTC media subsystem.
 */
export interface MediaUpdate {
  app_id: string;
  title: string;
  artist: string;
  is_playing: boolean;
  duration: number;
  position: number;
  artwork: string | null;
}

/**
 * Payload emitted by the focus timer subsystem.
 */
export interface TimerTick {
  seconds_remaining: number;
  is_running: boolean;
}

/**
 * Maps each Tauri event to its strongly typed payload.
 */
export interface TauriEventPayloads {
  fullscreen_state_changed: FullscreenStateChanged;
  telemetry_update: TelemetryUpdate;
  media_update: MediaUpdate;
  timer_tick: TimerTick;
}

/**
 * Type-safe Tauri event listener.
 *
 * Consumers specify an event name and TypeScript automatically
 * determines the payload type for the handler.
 */
export function useTauriTypedEvent<K extends keyof TauriEventPayloads>(
  eventName: K,
  handler: (payload: TauriEventPayloads[K]) => void,
): void {
  useTauriEvent<TauriEventPayloads[K]>(eventName, handler);
}