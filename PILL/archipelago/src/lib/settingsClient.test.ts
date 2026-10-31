import { describe, expect, it, vi } from 'vitest';
import { createSettingsClient } from '../../../shared/settings/client';
import { DEFAULT_PILL_SETTINGS } from '../../../shared/settings/PillSettings';

describe('settings write queue', () => {
  it('preserves write order and continues after a failed update', async () => {
    const call = vi.fn().mockRejectedValueOnce(new Error('disk busy')).mockResolvedValueOnce({ ...DEFAULT_PILL_SETTINGS, revision: 2 });
    const client = createSettingsClient(call);
    const first = client.patch({ appearance: { theme: 'blue' } });
    const second = client.patch({ widgets: { media: false } });
    await expect(first).rejects.toThrow('disk busy');
    await expect(second).resolves.toHaveProperty('revision', 2);
    expect(call.mock.calls.map((args) => args.slice(0, 2))).toEqual([
      ['update_settings', { patch: { appearance: { theme: 'blue' } } }],
      ['update_settings', { patch: { widgets: { media: false } } }],
    ]);
  });
});
