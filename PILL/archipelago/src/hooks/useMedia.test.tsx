import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMedia } from './useMedia';

vi.mock('../lib/tauriEvents', async () => {
  const actual = await vi.importActual<typeof import('../lib/tauriEvents')>(
    '../lib/tauriEvents',
  );

  return {
    ...actual,
    useTauriTypedEvent: vi.fn(),
  };
});

describe('useMedia', () => {
  it('starts with empty media state', () => {
    const { result } = renderHook(() => useMedia());

    expect(result.current.hasMedia).toBe(false);
    expect(result.current.media.title).toBe('');
    expect(result.current.media.artist).toBe('');
    expect(result.current.media.is_playing).toBe(false);
  });
});