import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { useMediaStore } from './mediaStore';

const emptyMedia = {
  app_id: '',
  title: '',
  artist: '',
  is_playing: false,
  duration: 0,
  position: 0,
  artwork: null,
};

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
    media: emptyMedia,
    hasMedia: false,
  });
});

afterEach(() => {
  useMediaStore.setState({
    media: emptyMedia,
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

  it('recognizes media with a title', () => {
    useMediaStore
      .getState()
      .setMedia({
        ...emptyMedia,
        title: 'Test Song',
      });

    expect(
      useMediaStore.getState().hasMedia,
    ).toBe(true);
  });

  it('recognizes media with an artist', () => {
    useMediaStore
      .getState()
      .setMedia({
        ...emptyMedia,
        artist: 'Test Artist',
      });

    expect(
      useMediaStore.getState().hasMedia,
    ).toBe(true);
  });

  it('rejects whitespace-only metadata', () => {
    useMediaStore
      .getState()
      .setMedia({
        ...emptyMedia,
        title: '   ',
        artist: '   ',
      });

    expect(
      useMediaStore.getState().hasMedia,
    ).toBe(false);
  });

  it('rejects whitespace-only title', () => {
    useMediaStore
      .getState()
      .setMedia({
        ...emptyMedia,
        title: '   ',
      });

    expect(
      useMediaStore.getState().hasMedia,
    ).toBe(false);
  });

  it('rejects whitespace-only artist', () => {
    useMediaStore
      .getState()
      .setMedia({
        ...emptyMedia,
        artist: '\t\n',
      });

    expect(
      useMediaStore.getState().hasMedia,
    ).toBe(false);
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