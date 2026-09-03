import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Island } from './Island';
import { useIslandStore } from '../../store/islandStore';
import { useTauriTypedEvent } from '../../lib/tauriEvents';

// Clean up the React DOM after every test so components from previous
// tests cannot interfere with the current test.
afterEach(() => {
  cleanup();
});

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

// Mock inner states since they might not be fully implemented or relevant here
vi.mock('../states/IdleState', () => ({
  IdleState: () => <div data-testid="idle-state">Idle</div>,
}));

vi.mock('../states/CompactState', () => ({
  CompactState: () => <div data-testid="compact-state">Compact</div>,
}));

vi.mock('../states/ExpandedState', () => ({
  ExpandedState: ({ onCollapse }: { onCollapse: () => void }) => (
    <div data-testid="expanded-state">
      <button onClick={onCollapse}>Collapse</button>
    </div>
  ),
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
describe('Island Component', () => {
  beforeEach(() => {
  useIslandStore.setState({
    state: 'idle',
    visible: true,
    isEvasionActive: false,
    activeWidgets: [],
  });

  vi.clearAllMocks();

  vi.mocked(useTauriTypedEvent).mockImplementation(
    () => undefined,
  );
});

  it('renders idle state initially', () => {
    render(<Island />);

    expect(screen.getByTestId('idle-state')).toBeInTheDocument();
  });

  it('transitions to compact state on mouse enter', async () => {
    render(<Island />);

    const island = document.querySelector(
      '.island-wrapper > div'
    ) as HTMLElement;

    fireEvent.mouseEnter(island);

    await waitFor(() => {
      expect(screen.getByTestId('compact-state')).toBeInTheDocument();
    });
  });

  it('transitions from compact to expanded state on click', async () => {
    useIslandStore.setState({ state: 'compact' });

    render(<Island />);

    const island = document.querySelector(
      '.island-wrapper > div'
    ) as HTMLElement;

    fireEvent.click(island);

    await waitFor(() => {
      expect(screen.getByTestId('expanded-state')).toBeInTheDocument();
    });
  });

  it('transitions from expanded to idle on collapse', async () => {
    useIslandStore.setState({ state: 'expanded' });

    render(<Island />);

    const collapseButton = screen.getByRole('button', {
      name: 'Collapse',
    });

    fireEvent.click(collapseButton);

    await waitFor(() => {
      expect(screen.getByTestId('idle-state')).toBeInTheDocument();
    });
  });

  it('renders split state when the store enters split mode', () => {
    useIslandStore.setState({ state: 'split' });

    render(<Island />);

    expect(screen.getByText('Primary')).toBeInTheDocument();
  });
});
