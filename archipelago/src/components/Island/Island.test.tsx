import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Island } from './Island';
import { useIslandStore } from '../../store/islandStore';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

// Mock inner states since they might not be fully implemented or relevant here
vi.mock('../states/IdleState', () => ({ IdleState: () => <div data-testid="idle-state">Idle</div> }));
vi.mock('../states/CompactState', () => ({ CompactState: () => <div data-testid="compact-state">Compact</div> }));
vi.mock('../states/ExpandedState', () => ({ ExpandedState: ({ onCollapse }: any) => <div data-testid="expanded-state"><button onClick={onCollapse}>Collapse</button></div> }));

describe('Island Component', () => {
  beforeEach(() => {
    // Reset store state before each test
    useIslandStore.setState({ state: 'idle', visible: true });
    vi.clearAllMocks();
  });

  it('renders idle state initially', () => {
    render(<Island />);
    expect(screen.getByTestId('idle-state')).toBeInTheDocument();
  });

  it('transitions to compact state on mouse enter', async () => {
    render(<Island />);
    
    const island = document.querySelector('.island-wrapper > div') as HTMLElement;
    fireEvent.mouseEnter(island);

    await waitFor(() => {
      expect(screen.getByTestId('compact-state')).toBeInTheDocument();
    });
  });

  it('transitions from compact to expanded state on click', async () => {
    useIslandStore.setState({ state: 'compact' });
    render(<Island />);
    
    const island = document.querySelector('.island-wrapper > div') as HTMLElement;
    fireEvent.click(island);

    await waitFor(() => {
      expect(screen.getByTestId('expanded-state')).toBeInTheDocument();
    });
  });

  it('transitions from expanded to idle on collapse', async () => {
    useIslandStore.setState({ state: 'expanded' });
    render(<Island />);
    
    const collapseBtn = screen.getByText('Collapse');
    fireEvent.click(collapseBtn);

    await waitFor(() => {
      expect(screen.getByTestId('idle-state')).toBeInTheDocument();
    });
  });
});
