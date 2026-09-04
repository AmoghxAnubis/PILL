import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { Island } from './Island';
import { useIslandStore } from '../../store/islandStore';
import {
  useTauriTypedEvent,
  type FullscreenStateChanged,
} from '../../lib/tauriEvents';

// -----------------------------------------------------------------------------
// Test cleanup
// -----------------------------------------------------------------------------

afterEach(() => {
  cleanup();
});

// -----------------------------------------------------------------------------
// Tauri mocks
// -----------------------------------------------------------------------------

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../lib/tauriEvents', async () => {
  const actual = await vi.importActual<
    typeof import('../../lib/tauriEvents')
  >('../../lib/tauriEvents');

  return {
    ...actual,
    useTauriTypedEvent: vi.fn(),
  };
});

// -----------------------------------------------------------------------------
// State mocks
// -----------------------------------------------------------------------------

vi.mock('../states/IdleState', () => ({
  IdleState: () => (
    <div data-testid="idle-state">
      Idle
    </div>
  ),
}));

vi.mock('../states/CompactState', () => ({
  CompactState: () => (
    <div data-testid="compact-state">
      Compact
    </div>
  ),
}));

vi.mock('../states/ExpandedState', () => ({
  ExpandedState: ({
    onCollapse,
  }: {
    onCollapse: () => void;
  }) => (
    <div data-testid="expanded-state">
      <button onClick={onCollapse}>
        Collapse
      </button>
    </div>
  ),
}));

describe('Island Component', () => {
  let fullscreenHandler:
    | ((payload: FullscreenStateChanged) => void)
    | undefined;

  beforeEach(() => {
    useIslandStore.setState({
      state: 'idle',
      visible: true,
      isEvasionActive: false,
      activeWidgets: [],
    });

    fullscreenHandler = undefined;

    vi.clearAllMocks();

    vi.mocked(useTauriTypedEvent).mockImplementation(
      ((
        _eventName: string,
        handler: (
          payload: FullscreenStateChanged,
        ) => void,
      ) => {
        fullscreenHandler = handler;
      }) as unknown as typeof useTauriTypedEvent,
    );
  });

  // ---------------------------------------------------------------------------
  // Existing Island state tests
  // ---------------------------------------------------------------------------

  it('renders idle state initially', () => {
    render(<Island />);

    expect(
      screen.getByTestId('idle-state'),
    ).toBeInTheDocument();
  });

  it('transitions to compact state on mouse enter', async () => {
    render(<Island />);

    const island = document.querySelector(
      '.island-wrapper > div',
    ) as HTMLElement;

    fireEvent.mouseEnter(island);

    await waitFor(() => {
      expect(
        screen.getByTestId('compact-state'),
      ).toBeInTheDocument();
    });
  });

  it('transitions from compact to expanded state on click', async () => {
    useIslandStore.setState({
      state: 'compact',
    });

    render(<Island />);

    const island = document.querySelector(
      '.island-wrapper > div',
    ) as HTMLElement;

    fireEvent.click(island);

    await waitFor(() => {
      expect(
        screen.getByTestId('expanded-state'),
      ).toBeInTheDocument();
    });
  });

  it('transitions from expanded to idle on collapse', async () => {
    useIslandStore.setState({
      state: 'expanded',
    });

    render(<Island />);

    const collapseButton = screen.getByRole(
      'button',
      {
        name: 'Collapse',
      },
    );

    fireEvent.click(collapseButton);

    await waitFor(() => {
      expect(
        screen.getByTestId('idle-state'),
      ).toBeInTheDocument();
    });
  });

  it('renders split state when the store enters split mode', () => {
    useIslandStore.setState({
      state: 'split',
    });

    render(<Island />);

    expect(
      screen.getByText('Primary'),
    ).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Evasion integration tests
  // ---------------------------------------------------------------------------

  it('registers a fullscreen state listener', () => {
    render(<Island />);

    expect(
      useTauriTypedEvent,
    ).toHaveBeenCalledTimes(1);

    expect(
      useTauriTypedEvent,
    ).toHaveBeenCalledWith(
      'fullscreen_state_changed',
      expect.any(Function),
    );

    expect(fullscreenHandler).toBeDefined();
  });

  it('hides the Island when fullscreen evasion becomes active', async () => {
    render(<Island />);

    expect(fullscreenHandler).toBeDefined();

    act(() => {
      fullscreenHandler?.({
        active: true,
      });
    });

    const island = document.querySelector(
      '.island-wrapper > div',
    ) as HTMLElement;

    await waitFor(() => {
      expect(
        useIslandStore.getState().isEvasionActive,
      ).toBe(true);

      expect(island).toHaveStyle({
        pointerEvents: 'none',
      });
    });
  });

  it('shows the Island again when fullscreen evasion ends', async () => {
    render(<Island />);

    expect(fullscreenHandler).toBeDefined();

    act(() => {
      fullscreenHandler?.({
        active: true,
      });
    });

    act(() => {
      fullscreenHandler?.({
        active: false,
      });
    });

    const island = document.querySelector(
      '.island-wrapper > div',
    ) as HTMLElement;

    await waitFor(() => {
      expect(
        useIslandStore.getState().isEvasionActive,
      ).toBe(false);

      expect(island).toHaveStyle({
        pointerEvents: 'auto',
      });
    });
  });

  it('preserves the current Island state during fullscreen evasion', async () => {
    useIslandStore.setState({
      state: 'expanded',
    });

    render(<Island />);

    expect(
      screen.getByTestId('expanded-state'),
    ).toBeInTheDocument();

    expect(fullscreenHandler).toBeDefined();

    act(() => {
      fullscreenHandler?.({
        active: true,
      });
    });

    await waitFor(() => {
      expect(
        useIslandStore.getState().isEvasionActive,
      ).toBe(true);

      expect(
        useIslandStore.getState().state,
      ).toBe('expanded');
    });

    expect(
      screen.getByTestId('expanded-state'),
    ).toBeInTheDocument();

    act(() => {
      fullscreenHandler?.({
        active: false,
      });
    });

    await waitFor(() => {
      expect(
        useIslandStore.getState().isEvasionActive,
      ).toBe(false);

      expect(
        useIslandStore.getState().state,
      ).toBe('expanded');
    });

    expect(
      screen.getByTestId('expanded-state'),
    ).toBeInTheDocument();
  });
});
it('respects application-level visibility independently of evasion', async () => {
  useIslandStore.setState({
    visible: false,
    isEvasionActive: false,
  });

  render(<Island />);

  const island = document.querySelector(
    '.island-wrapper > div',
  ) as HTMLElement;

  await waitFor(() => {
    expect(island).toHaveStyle({
      pointerEvents: 'none',
    });
  });
});

it('keeps the Island hidden when either visibility mechanism disables it', async () => {
  useIslandStore.setState({
    visible: false,
    isEvasionActive: true,
  });

  render(<Island />);

  const island = document.querySelector(
    '.island-wrapper > div',
  ) as HTMLElement;

  await waitFor(() => {
    expect(island).toHaveStyle({
      pointerEvents: 'none',
    });
  });
});