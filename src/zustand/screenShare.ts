import { create } from 'zustand';
import logger from '../services/logger';
import { useSettingsStore } from './settings';
import { useShidurStore } from './shidur';
import { useUiActions } from './uiActions';

const NAMESPACE = 'ScreenShare';

// A shared screen is published (by the web client) as a separate VideoRoom
// participant with this display role. It is not a room member: it never goes
// into the feeds store, it is shown in place of the broadcast panel.
export const SCREEN_ROLE = 'screen';

type Display = {
  id?: string;
  role?: string;
  display?: string;
  timestamp?: number;
  [key: string]: unknown;
};

type PubStream = {
  type?: string;
  codec?: string;
  mid?: string;
  disabled?: boolean;
};

type Pub = {
  id: string | number;
  display?: string | Display | null;
  streams?: PubStream[];
};

export type ScreenFeed = {
  id: string | number;
  display: Display;
  vMid?: string;
};

type PanelSource = 'screen' | 'broadcast' | null;

type PreScreenState = {
  isShidur: boolean;
  isPlay: boolean;
  isKliOlami: boolean;
};

export const parseDisplay = (display: unknown): Display => {
  if (typeof display !== 'string') return (display as Display) || {};
  try {
    return JSON.parse(display) || {};
  } catch {
    return {};
  }
};

export const isScreenFeed = (pub?: { display?: unknown } | null): boolean =>
  parseDisplay(pub?.display).role === SCREEN_ROLE;

// Two shares at once: the one that started first wins (same rule as the web
// client, so every client in the room picks the same one).
export const pickScreenWinner = <
  T extends { id: string | number; display?: Display },
>(
  a: T,
  b: T
): T => {
  const ts = (f: T) => f.display?.timestamp || 0;
  if (ts(a) !== ts(b)) return ts(a) < ts(b) ? a : b;
  return String(a.id) <= String(b.id) ? a : b;
};

// Streams of a screen feed to subscribe to.
export const getScreenSubscription = (pub: Pub, withVideo: boolean) =>
  (pub.streams || [])
    .filter(
      s =>
        (withVideo && s.type === 'video' && s.codec === 'h264') ||
        (s.type === 'audio' && s.codec === 'opus')
    )
    .map(s => ({ feed: pub.id, mid: s.mid }));

// Panel state saved when entering screen mode, restored when the share ends.
let preScreenState: PreScreenState | null = null;
// Remote audio plays as soon as it is subscribed (no view involved), so the
// track is kept to silence the screen while the broadcast is shown instead.
let audioTrack: { enabled: boolean } | null = null;

const applyAudio = (panelSource: PanelSource) => {
  if (!audioTrack) return;
  try {
    audioTrack.enabled = panelSource === 'screen';
  } catch (error) {
    logger.error(NAMESPACE, 'Error toggling screen audio', error);
  }
};

interface ScreenShareState {
  // the screen feed currently shared in the room
  screenFeed: ScreenFeed | null;
  // url of its remote stream, null while connecting / audio only
  screenUrl: string | null;
  // what the broadcast panel shows while a screen is shared
  panelSource: PanelSource;
  // video is not received (audio mode / app in background)
  videoOff: boolean;

  isScreenId: (id: unknown) => boolean;
  isVideoWanted: () => boolean;
  setVideoOff: (videoOff: boolean) => void;
  handleScreenFeed: (pub: Pub) => {
    subscribe: boolean;
    unsubscribeId?: string | number;
  };
  clearScreenFeed: () => void;
  onScreenTrack: (
    track: { kind: string; enabled: boolean },
    stream: { toURL: () => string }
  ) => void;
  enterScreenMode: () => Promise<void>;
  exitScreenMode: () => Promise<void>;
  onShidurToggled: (isShidur: boolean) => void;
  resumeIsPlay: () => boolean | undefined;
  showSharedScreen: () => void;
  onFeedsJoined: () => void;
  reset: (keepScreenMode?: boolean) => void;
}

export const useScreenShareStore = create<ScreenShareState>((set, get) => ({
  screenFeed: null,
  screenUrl: null,
  panelSource: null,
  videoOff: false,

  isScreenId: id => {
    const { screenFeed } = get();
    return !!screenFeed && String(screenFeed.id) === String(id);
  },

  isVideoWanted: () =>
    !get().videoOff && !useSettingsStore.getState().audioMode,

  setVideoOff: videoOff => set({ videoOff }),

  // A screen feed is in the room (called from feeds' makeSubscription).
  // Tells the caller whether to subscribe to it and which feed to drop.
  handleScreenFeed: pub => {
    const feed: ScreenFeed = {
      id: pub.id,
      display: parseDisplay(pub.display),
      vMid: pub.streams?.find(s => s.type === 'video' && s.codec === 'h264')
        ?.mid,
    };
    const current = get().screenFeed;

    if (current && String(current.id) === String(feed.id)) {
      if (feed.vMid && feed.vMid !== current.vMid) {
        set({ screenFeed: { ...current, vMid: feed.vMid } });
      }
      return { subscribe: false };
    }

    let unsubscribeId;
    if (current) {
      if (pickScreenWinner(current, feed) === current) {
        logger.info(NAMESPACE, 'second screen feed ignored', feed.id);
        return { subscribe: false };
      }
      unsubscribeId = current.id;
      audioTrack = null;
    }

    logger.info(NAMESPACE, 'screen feed in room', feed.id, feed.display);
    set({ screenFeed: feed, screenUrl: null });
    get()
      .enterScreenMode()
      .catch(error => logger.error(NAMESPACE, 'enterScreenMode', error));

    return { subscribe: true, unsubscribeId };
  },

  // The screen feed left the room.
  clearScreenFeed: () => {
    const { screenFeed } = get();
    if (!screenFeed) return;
    logger.info(NAMESPACE, 'screen feed left', screenFeed.id);
    audioTrack = null;
    set({ screenFeed: null, screenUrl: null });
    get()
      .exitScreenMode()
      .catch(error => logger.error(NAMESPACE, 'exitScreenMode', error));
  },

  onScreenTrack: (track, stream) => {
    logger.info(NAMESPACE, 'screen track', track.kind);
    if (track.kind === 'audio') {
      audioTrack = track;
      applyAudio(get().panelSource);
      return;
    }
    try {
      set({ screenUrl: stream.toURL() });
    } catch (error) {
      logger.error(NAMESPACE, 'Error setting screen url', error);
    }
  },

  // Show the shared screen in the broadcast panel: broadcast and Kli Olami off.
  enterScreenMode: async () => {
    const settings = useSettingsStore.getState();

    if (preScreenState) {
      // Already in screen mode: another screen feed, or rejoin after restart.
      const panelSource = settings.isShidur ? 'broadcast' : 'screen';
      set({ panelSource });
      applyAudio(panelSource);
      return;
    }

    const { isShidur, isKliOlami } = settings;
    preScreenState = {
      isShidur,
      isKliOlami,
      isPlay: useShidurStore.getState().isPlay,
    };
    logger.info(NAMESPACE, 'enterScreenMode', preScreenState);

    set({ panelSource: 'screen' });
    applyAudio('screen');

    if (isKliOlami) {
      useSettingsStore.setState({ isKliOlamiFullscreen: false });
      settings.toggleIsKliOlami(false);
    }
    if (isShidur) {
      useSettingsStore.setState({ isShidur: false });
      await useShidurStore.getState().cleanShidur();
    }
    useUiActions.getState().updateWidth();
  },

  // Restore the panel state saved in enterScreenMode.
  exitScreenMode: async () => {
    const prev = preScreenState;
    if (!prev) return;
    preScreenState = null;
    logger.info(NAMESPACE, 'exitScreenMode', prev);

    set({ panelSource: null });
    const settings = useSettingsStore.getState();

    // If the user switched back to the broadcast during the share, it's on.
    const restoreShidur = prev.isShidur && !settings.isShidur;
    if (restoreShidur) {
      useSettingsStore.setState({ isShidur: true });
    } else if (!settings.isShidur && settings.isFullscreen) {
      // Nothing left to show in the fullscreen panel.
      settings.toggleIsFullscreen(false);
    }
    if (prev.isKliOlami && !settings.isKliOlami) {
      settings.toggleIsKliOlami(true);
    }
    useUiActions.getState().updateWidth();
    if (restoreShidur) {
      await useShidurStore.getState().prepareShidur(prev.isPlay);
    }
  },

  // The broadcast was switched on/off (settings.toggleIsShidur): while a
  // screen is shared the panel shows either the broadcast or the screen.
  onShidurToggled: isShidur => {
    if (!get().screenFeed) return;
    const panelSource = isShidur ? 'broadcast' : 'screen';
    set({ panelSource });
    applyAudio(panelSource);
  },

  // The broadcast was stopped by screen mode, not by the user: when the user
  // switches back to it during the share, it should play again right away.
  resumeIsPlay: () => (preScreenState?.isPlay ? true : undefined),

  // Somebody shares and we watch the broadcast: switch the panel to the screen.
  showSharedScreen: () => {
    if (!get().screenFeed || get().panelSource === 'screen') return;
    const settings = useSettingsStore.getState();
    if (settings.isShidur) {
      settings.toggleIsShidur();
    } else {
      get().onShidurToggled(false);
    }
  },

  // Joined the videoroom (also after a restart): the share may be gone.
  onFeedsJoined: () => {
    if (preScreenState && !get().screenFeed) {
      get()
        .exitScreenMode()
        .catch(error => logger.error(NAMESPACE, 'exitScreenMode', error));
    }
  },

  // The videoroom session is gone. On a restart screen mode is kept: the
  // rejoin finds the screen feed again or exits screen mode (onFeedsJoined).
  // On leaving the room only the broadcast entry preset is restored — the
  // broadcast itself is being torn down by exitRoom.
  reset: (keepScreenMode = false) => {
    audioTrack = null;
    if (keepScreenMode && preScreenState) {
      set({ screenFeed: null, screenUrl: null });
      return;
    }
    const prev = preScreenState;
    preScreenState = null;
    set({ screenFeed: null, screenUrl: null, panelSource: null });
    if (prev?.isShidur) {
      useSettingsStore.setState({ isShidur: true });
    }
  },
}));
