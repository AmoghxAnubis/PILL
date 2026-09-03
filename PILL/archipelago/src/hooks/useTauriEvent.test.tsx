import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listen } from '@tauri-apps/api/event';
import type {
  EventCallback,
  UnlistenFn,
} from '@tauri-apps/api/event';

import { useTauriEvent } from './useTauriEvent';

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

type TestPayload = {
  value: string;
};

describe('useTauriEvent', () => {
  let emitEvent:
    | ((payload: TestPayload) => void)
    | undefined;

  let unlisten: UnlistenFn;

  beforeEach(() => {
    vi.clearAllMocks();

    emitEvent = undefined;
    unlisten = vi.fn();

    const mockedListen = vi.mocked(listen);

    mockedListen.mockImplementation(
      ((
        _eventName: string,
        callback: EventCallback<TestPayload>,
      ) => {
        emitEvent = (payload) => {
          callback({
            event: 'test_event',
            id: 0,
            payload,
          });
        };

        return Promise.resolve(unlisten);
      }) as unknown as typeof listen,
    );
  });

  function TestComponent({
    handler,
  }: {
    handler: (payload: TestPayload) => void;
  }) {
    useTauriEvent<TestPayload>(
      'test_event',
      handler,
    );

    return (
      <div data-testid="listener-test">
        Listening
      </div>
    );
  }

  it('registers a Tauri event listener', () => {
    const handler = vi.fn();

    render(
      <TestComponent handler={handler} />,
    );

    expect(listen).toHaveBeenCalledTimes(1);

    expect(listen).toHaveBeenCalledWith(
      'test_event',
      expect.any(Function),
    );
  });

  it('passes event payload to the latest handler', async () => {
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    const { rerender } = render(
      <TestComponent handler={firstHandler} />,
    );

    rerender(
      <TestComponent handler={secondHandler} />,
    );

    await act(async () => {
      emitEvent?.({
        value: 'hello',
      });
    });

    expect(firstHandler).not.toHaveBeenCalled();

    expect(secondHandler).toHaveBeenCalledWith({
      value: 'hello',
    });
  });

  it('does not resubscribe when only the handler changes', () => {
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    const { rerender } = render(
      <TestComponent handler={firstHandler} />,
    );

    rerender(
      <TestComponent handler={secondHandler} />,
    );

    expect(listen).toHaveBeenCalledTimes(1);
  });

  it('unregisters the listener when the component unmounts', async () => {
    const handler = vi.fn();

    const { unmount } = render(
      <TestComponent handler={handler} />,
    );

    // Allow the mocked listen() promise to resolve.
    await act(async () => {});

    unmount();

    expect(unlisten).toHaveBeenCalledTimes(1);
  });

  it('cleans up if the listener resolves after unmount', async () => {
    const handler = vi.fn();

    let resolveListen:
      | ((cleanup: UnlistenFn) => void)
      | undefined;

    vi.mocked(listen).mockImplementationOnce(
      (() =>
        new Promise<UnlistenFn>((resolve) => {
          resolveListen = resolve;
        })) as unknown as typeof listen,
    );

    const { unmount } = render(
      <TestComponent handler={handler} />,
    );

    unmount();

    const lateCleanup = vi.fn();

    await act(async () => {
      resolveListen?.(lateCleanup);
    });

    expect(lateCleanup).toHaveBeenCalledTimes(1);
  });
});