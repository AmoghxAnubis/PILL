import {
  cleanup,
  renderHook,
} from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useFeatureSources } from './useFeatureSources';
import { useMediaSource } from './useMediaSource';
import { useFocusTimer } from './useFocusTimer';

vi.mock('./useMediaSource', () => ({
  useMediaSource: vi.fn(),
}));

vi.mock('./useFocusTimer', () => ({
  useFocusTimer: vi.fn(),
}));

const mockedUseMediaSource =
  vi.mocked(useMediaSource);

const mockedUseFocusTimer =
  vi.mocked(useFocusTimer);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('useFeatureSources', () => {
  it('mounts the media feature source', () => {
    renderHook(() => useFeatureSources());

    expect(
      mockedUseMediaSource,
    ).toHaveBeenCalledTimes(1);
  });

  it('mounts the focus timer feature source', () => {
    renderHook(() => useFeatureSources());

    expect(
      mockedUseFocusTimer,
    ).toHaveBeenCalledTimes(1);
  });

  it('mounts all feature sources together', () => {
    renderHook(() => useFeatureSources());

    expect(
      mockedUseMediaSource,
    ).toHaveBeenCalledTimes(1);

    expect(
      mockedUseFocusTimer,
    ).toHaveBeenCalledTimes(1);
  });
});