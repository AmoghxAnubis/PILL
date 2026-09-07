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
} from 'vitest';

import { useMedia } from './useMedia';
import { useMediaStore } from '../store/mediaStore';

beforeEach(() => {
  useMediaStore.setState({
    media: {
      app_id: '',
      title: '',
      artist: '',
      is_playing: false,
      duration: 0,
      position: 0,
      artwork: null,
    },
    hasMedia: false,
  });
});

afterEach(() => {
  cleanup();
});

describe('useMedia', () => {
  it('returns empty media by default', () => {
    const { result } = renderHook(
      () => useMedia(),
    );

    expect(result.current.hasMedia).toBe(false);
    expect(result.current.media.title).toBe('');
  });

  it('returns media from the media store', () => {
    useMediaStore.getState().setMedia({
      app_id: 'spotify',
      title: 'Test Song',
      artist: 'Test Artist',
      is_playing: true,
      duration: 240,
      position: 30,
      artwork: null,
    });

    const { result } = renderHook(
      () => useMedia(),
    );

    expect(result.current.hasMedia).toBe(true);
    expect(result.current.media.title).toBe(
      'Test Song',
    );
  });
});