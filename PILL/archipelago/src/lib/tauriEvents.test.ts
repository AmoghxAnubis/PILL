import { describe, expect, it, vi } from 'vitest';

import {
  TAURI_EVENTS,
  type FullscreenStateChanged,
  type MediaUpdate,
  type TelemetryUpdate,
  type TimerTick,
} from './tauriEvents';

describe('Tauri event contracts', () => {
  it('uses the canonical event names', () => {
    expect(TAURI_EVENTS.FULLSCREEN_STATE_CHANGED).toBe(
      'fullscreen_state_changed',
    );

    expect(TAURI_EVENTS.TELEMETRY_UPDATE).toBe(
      'telemetry_update',
    );

    expect(TAURI_EVENTS.MEDIA_UPDATE).toBe(
      'media_update',
    );

    expect(TAURI_EVENTS.TIMER_TICK).toBe(
      'timer_tick',
    );
  });

  it('supports the fullscreen payload contract', () => {
    const payload: FullscreenStateChanged = {
      active: true,
    };

    expect(payload.active).toBe(true);
  });

  it('supports the telemetry payload contract', () => {
    const payload: TelemetryUpdate = {
      cpu_usage: 92.5,
      ram_allocated_mb: 8192,
      ram_percentage: 87.3,
    };

    expect(payload.cpu_usage).toBe(92.5);
    expect(payload.ram_allocated_mb).toBe(8192);
    expect(payload.ram_percentage).toBe(87.3);
  });

  it('supports the media payload contract', () => {
    const payload: MediaUpdate = {
      app_id: 'spotify',
      title: 'Test Track',
      artist: 'Test Artist',
      is_playing: true,
      duration: 240,
      position: 42,
      artwork: null,
    };

    expect(payload.title).toBe('Test Track');
    expect(payload.artist).toBe('Test Artist');
    expect(payload.is_playing).toBe(true);
  });

  it('supports the timer payload contract', () => {
    const payload: TimerTick = {
      seconds_remaining: 1500,
      is_running: true,
    };

    expect(payload.seconds_remaining).toBe(1500);
    expect(payload.is_running).toBe(true);
  });

  it('does not require consumers to instantiate event payloads at runtime', () => {
    // These payload definitions are TypeScript contracts only.
    // This test makes that intent explicit.
    expect(
      vi.fn<(payload: TimerTick) => void>(),
    ).toBeDefined();
  });
});