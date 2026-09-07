import { renderHook } from '@testing-library/react';

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useFeatureSources } from './useFeatureSources';

vi.mock('./useMedia', () => ({
  useMedia: vi.fn(),
}));

vi.mock('./useFocusTimer', () => ({
  useFocusTimer: vi.fn(),
}));

import { useMedia } from './useMedia';
import { useFocusTimer } from './useFocusTimer';

describe('useFeatureSources', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('mounts the media feature source', () => {
    renderHook(() => useFeatureSources());

    expect(
      useMedia,
    ).toHaveBeenCalled();
  });

  it('mounts the focus timer feature source', () => {
    renderHook(() => useFeatureSources());

    expect(
      useFocusTimer,
    ).toHaveBeenCalled();
  });

  it('mounts all feature sources together', () => {
    renderHook(() => useFeatureSources());

    expect(
      useMedia,
    ).toHaveBeenCalledTimes(1);

    expect(
      useFocusTimer,
    ).toHaveBeenCalledTimes(1);
  });
});