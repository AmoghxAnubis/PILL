import { beforeEach, describe, expect, it } from 'vitest';

import {
  isIslandVisible,
  useIslandStore,
} from './islandStore';

describe('Island visibility', () => {
  beforeEach(() => {
    useIslandStore.setState({
      state: 'idle',
      visible: true,
      isEvasionActive: false,
      activeWidgets: [],
    });
  });

  it('is visible when visibility is enabled and evasion is inactive', () => {
    expect(
      isIslandVisible(true, false),
    ).toBe(true);
  });

  it('is hidden when application visibility is disabled', () => {
    expect(
      isIslandVisible(false, false),
    ).toBe(false);
  });

  it('is hidden when fullscreen evasion is active', () => {
    expect(
      isIslandVisible(true, true),
    ).toBe(false);
  });

  it('is hidden when both visibility controls are inactive', () => {
    expect(
      isIslandVisible(false, true),
    ).toBe(false);
  });
});

describe('Island store', () => {
  beforeEach(() => {
    useIslandStore.setState({
      state: 'idle',
      visible: true,
      isEvasionActive: false,
      activeWidgets: [],
    });
  });

  it('updates application visibility independently', () => {
    useIslandStore
      .getState()
      .setVisible(false);

    const state = useIslandStore.getState();

    expect(state.visible).toBe(false);
    expect(state.isEvasionActive).toBe(false);
  });

  it('updates evasion state independently', () => {
    useIslandStore
      .getState()
      .setEvasionActive(true);

    const state = useIslandStore.getState();

    expect(state.visible).toBe(true);
    expect(state.isEvasionActive).toBe(true);
  });

  it('does not modify Island state when evasion changes', () => {
    useIslandStore.setState({
      state: 'expanded',
      visible: true,
      isEvasionActive: false,
      activeWidgets: [],
    });

    useIslandStore
      .getState()
      .setEvasionActive(true);

    expect(
      useIslandStore.getState().state,
    ).toBe('expanded');
  });
});