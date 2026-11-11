/**
 * @format
 * Unit tests for the pure helpers of src/zustand/screenShare.ts and the
 * screen-feed handling of the store.
 */

jest.mock('../src/zustand/settings', () => {
  const state = {
    isShidur: true,
    isKliOlami: false,
    isFullscreen: false,
    audioMode: false,
    toggleIsKliOlami: jest.fn(),
    toggleIsFullscreen: jest.fn(),
    toggleIsShidur: jest.fn(),
  };
  return {
    useSettingsStore: {
      getState: () => state,
      setState: patch => Object.assign(state, patch),
    },
  };
});
jest.mock('../src/zustand/shidur', () => {
  const state = {
    isPlay: true,
    cleanShidur: jest.fn(() => Promise.resolve()),
    prepareShidur: jest.fn(() => Promise.resolve()),
  };
  return { useShidurStore: { getState: () => state } };
});
jest.mock('../src/zustand/uiActions', () => ({
  useUiActions: { getState: () => ({ updateWidth: jest.fn() }) },
}));

import {
  getScreenSubscription,
  isScreenFeed,
  parseDisplay,
  pickScreenWinner,
  useScreenShareStore,
} from '../src/zustand/screenShare';
import { useSettingsStore } from '../src/zustand/settings';
import { useShidurStore } from '../src/zustand/shidur';

const flush = () => new Promise(resolve => setImmediate(resolve));

const screenPub = (id, timestamp, name = 'Sharer') => ({
  id,
  display: JSON.stringify({ role: 'screen', display: name, timestamp }),
  streams: [
    { type: 'audio', codec: 'opus', mid: '0' },
    { type: 'video', codec: 'h264', mid: '1' },
  ],
});

beforeEach(() => {
  jest.clearAllMocks();
  useScreenShareStore.getState().reset();
  useScreenShareStore.setState({ videoOff: false });
  useSettingsStore.setState({
    isShidur: true,
    isKliOlami: false,
    isFullscreen: false,
    audioMode: false,
  });
  useShidurStore.getState().isPlay = true;
});

describe('parseDisplay / isScreenFeed', () => {
  it('parses a JSON string and passes objects through', () => {
    expect(parseDisplay('{"role":"screen"}')).toEqual({ role: 'screen' });
    expect(parseDisplay({ role: 'user' })).toEqual({ role: 'user' });
  });

  it('returns an empty object for bad input', () => {
    expect(parseDisplay('not json')).toEqual({});
    expect(parseDisplay(undefined)).toEqual({});
    expect(parseDisplay(null)).toEqual({});
  });

  it('detects screen feeds by display role', () => {
    expect(isScreenFeed(screenPub('a', 1))).toBe(true);
    expect(isScreenFeed({ display: '{"role":"user"}' })).toBe(false);
    expect(isScreenFeed({ id: 'a' })).toBe(false);
    expect(isScreenFeed(null)).toBe(false);
  });
});

describe('pickScreenWinner', () => {
  const feed = (id, timestamp) => ({ id, display: { timestamp } });

  it('prefers the earlier timestamp', () => {
    const a = feed('a', 200);
    const b = feed('b', 100);
    expect(pickScreenWinner(a, b)).toBe(b);
    expect(pickScreenWinner(b, a)).toBe(b);
  });

  it('breaks a tie by the smaller id', () => {
    const a = feed('a', 100);
    const b = feed('b', 100);
    expect(pickScreenWinner(a, b)).toBe(a);
    expect(pickScreenWinner(b, a)).toBe(a);
  });
});

describe('getScreenSubscription', () => {
  it('takes opus audio and h264 video', () => {
    expect(getScreenSubscription(screenPub('a', 1), true)).toEqual([
      { feed: 'a', mid: '0' },
      { feed: 'a', mid: '1' },
    ]);
  });

  it('skips video when it is not wanted', () => {
    expect(getScreenSubscription(screenPub('a', 1), false)).toEqual([
      { feed: 'a', mid: '0' },
    ]);
  });
});

describe('screen mode', () => {
  it('turns the broadcast off and restores it when the share ends', async () => {
    const store = useScreenShareStore.getState();
    expect(store.handleScreenFeed(screenPub('a', 1))).toEqual({
      subscribe: true,
      unsubscribeId: undefined,
    });
    await flush();

    expect(useScreenShareStore.getState().panelSource).toBe('screen');
    expect(useScreenShareStore.getState().screenFeed.vMid).toBe('1');
    expect(store.isScreenId('a')).toBe(true);
    expect(useSettingsStore.getState().isShidur).toBe(false);
    expect(useShidurStore.getState().cleanShidur).toHaveBeenCalledTimes(1);

    store.clearScreenFeed();
    await flush();

    expect(useScreenShareStore.getState().panelSource).toBe(null);
    expect(useScreenShareStore.getState().screenFeed).toBe(null);
    expect(useSettingsStore.getState().isShidur).toBe(true);
    expect(useShidurStore.getState().prepareShidur).toHaveBeenCalledWith(true);
  });

  it('leaves the broadcast off if it was off before', async () => {
    useSettingsStore.setState({ isShidur: false });
    const store = useScreenShareStore.getState();
    store.handleScreenFeed(screenPub('a', 1));
    await flush();
    store.clearScreenFeed();
    await flush();

    expect(useSettingsStore.getState().isShidur).toBe(false);
    expect(useShidurStore.getState().cleanShidur).not.toHaveBeenCalled();
    expect(useShidurStore.getState().prepareShidur).not.toHaveBeenCalled();
  });

  it('does not restart the broadcast the user already switched back to', async () => {
    const store = useScreenShareStore.getState();
    store.handleScreenFeed(screenPub('a', 1));
    await flush();

    // what settings.toggleIsShidur does
    useSettingsStore.setState({ isShidur: true });
    store.onShidurToggled(true);
    expect(useScreenShareStore.getState().panelSource).toBe('broadcast');

    store.clearScreenFeed();
    await flush();
    expect(useShidurStore.getState().prepareShidur).not.toHaveBeenCalled();
  });

  it('ignores the same feed announced again', async () => {
    const store = useScreenShareStore.getState();
    store.handleScreenFeed(screenPub('a', 1));
    await flush();
    expect(store.handleScreenFeed(screenPub('a', 1))).toEqual({
      subscribe: false,
    });
  });

  it('keeps the earlier of two simultaneous shares', async () => {
    const store = useScreenShareStore.getState();
    store.handleScreenFeed(screenPub('late', 200));
    await flush();

    expect(store.handleScreenFeed(screenPub('early', 100))).toEqual({
      subscribe: true,
      unsubscribeId: 'late',
    });
    await flush();
    expect(useScreenShareStore.getState().screenFeed.id).toBe('early');

    expect(store.handleScreenFeed(screenPub('later', 300))).toEqual({
      subscribe: false,
    });
    expect(useScreenShareStore.getState().screenFeed.id).toBe('early');
    // the broadcast was stopped only once
    expect(useShidurStore.getState().cleanShidur).toHaveBeenCalledTimes(1);
  });

  it('silences the screen while the broadcast is shown', async () => {
    const store = useScreenShareStore.getState();
    store.handleScreenFeed(screenPub('a', 1));
    await flush();

    const track = { kind: 'audio', enabled: true };
    store.onScreenTrack(track, { toURL: () => 'url' });
    expect(track.enabled).toBe(true);

    store.onShidurToggled(true);
    expect(track.enabled).toBe(false);
    store.onShidurToggled(false);
    expect(track.enabled).toBe(true);
  });

  it('survives a feeds restart and exits if the share is gone after it', async () => {
    const store = useScreenShareStore.getState();
    store.handleScreenFeed(screenPub('a', 1));
    await flush();

    store.reset(true);
    expect(useScreenShareStore.getState().screenFeed).toBe(null);
    expect(useScreenShareStore.getState().panelSource).toBe('screen');
    expect(useSettingsStore.getState().isShidur).toBe(false);

    store.onFeedsJoined();
    await flush();
    expect(useScreenShareStore.getState().panelSource).toBe(null);
    expect(useSettingsStore.getState().isShidur).toBe(true);
    expect(useShidurStore.getState().prepareShidur).toHaveBeenCalledWith(true);
  });

  it('restores the broadcast preset on leaving the room', async () => {
    const store = useScreenShareStore.getState();
    store.handleScreenFeed(screenPub('a', 1));
    await flush();

    store.reset();
    expect(useScreenShareStore.getState().panelSource).toBe(null);
    expect(useSettingsStore.getState().isShidur).toBe(true);
    // the broadcast itself is torn down by exitRoom, not restarted here
    expect(useShidurStore.getState().prepareShidur).not.toHaveBeenCalled();
  });

  it('does not want video in audio mode', () => {
    const store = useScreenShareStore.getState();
    expect(store.isVideoWanted()).toBe(true);
    useSettingsStore.setState({ audioMode: true });
    expect(store.isVideoWanted()).toBe(false);
    useSettingsStore.setState({ audioMode: false });
    store.setVideoOff(true);
    expect(store.isVideoWanted()).toBe(false);
  });
});
