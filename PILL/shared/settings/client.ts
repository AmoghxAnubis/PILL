import type { PillSettings, SettingsPatch } from './PillSettings';

type Invoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

/** Each app orders its own writes; the shared native sidecar lock orders both. */
export function createSettingsClient(invoke: Invoke) {
  let queue: Promise<unknown> = Promise.resolve();
  const enqueue = (command: string, args?: Record<string, unknown>): Promise<PillSettings> => {
    const operation = queue.catch(() => undefined).then(() => invoke<PillSettings>(command, args));
    queue = operation;
    return operation;
  };
  return {
    load: () => invoke<PillSettings>('load_settings'),
    patch: (patch: SettingsPatch) => enqueue('update_settings', { patch }),
    reset: () => enqueue('reset_settings'),
  };
}
