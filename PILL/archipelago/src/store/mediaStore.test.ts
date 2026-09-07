import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { useMediaStore } from './mediaStore';

const mediaPayload = {
  app_id: 'spotify',
  title: 'Test Song',
  artist: 'Test Artist',
  is_playing: true,
  duration: 240,
  position: 30,
  artwork: null,
};

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

describe('mediaStore', () => {
  it('starts with empty media', () => {
    const state = useMediaStore.getState();

    expect(state.hasMedia).toBe(false);
    expect(state.media.title).toBe('');
  });

  it('stores meaningful media', () => {
    useMediaStore
      .getState()
      .setMedia(mediaPayload);

    const state = useMediaStore.getState();

    expect(state.hasMedia).toBe(true);
    expect(state.media).toEqual(
      mediaPayload,
    );
  });

  it('clears media', () => {
    useMediaStore
      .getState()
      .setMedia(mediaPayload);

    useMediaStore
      .getState()
      .clearMedia();

    const state = useMediaStore.getState();

    expect(state.hasMedia).toBe(false);
    expect(state.media.title).toBe('');
  });
});