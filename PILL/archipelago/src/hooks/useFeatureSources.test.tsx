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
import { useFocusTimerSource } from './useFocusTimerSource';
import { useTelemetrySource } from './useTelemetrySource';

vi.mock('./useMediaSource', () => ({
  useMediaSource: vi.fn(),
}));

vi.mock('./useFocusTimerSource', () => ({
  useFocusTimerSource: vi.fn(),
}));

vi.mock('./useTelemetrySource', () => ({
  useTelemetrySource: vi.fn(),
}));

const mockedUseMediaSource =
  vi.mocked(useMediaSource);

const mockedUseFocusTimerSource =
  vi.mocked(useFocusTimerSource);

const mockedUseTelemetrySource =
  vi.mocked(useTelemetrySource);

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
      mockedUseFocusTimerSource,
    ).toHaveBeenCalledTimes(1);
  });

  it('mounts the telemetry feature source', () => {
    renderHook(() => useFeatureSources());

    expect(
      mockedUseTelemetrySource,
    ).toHaveBeenCalledTimes(1);
  });

  it('mounts all feature sources together', () => {
    renderHook(() => useFeatureSources());

    expect(
      mockedUseMediaSource,
    ).toHaveBeenCalledTimes(1);

    expect(
      mockedUseFocusTimerSource,
    ).toHaveBeenCalledTimes(1);

    expect(
      mockedUseTelemetrySource,
    ).toHaveBeenCalledTimes(1);
  });
});