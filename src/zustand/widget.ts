import {
  AppState,
  Linking,
  NativeEventEmitter,
  NativeModule,
  Platform,
} from 'react-native';
import { create } from 'zustand';

import { STORAGE_KEYS } from '../constants';
import logger from '../services/logger';
import NativeWidgetModule from '../specs/NativeWidgetModule';
import { setToStorage } from '../tools';
import { useRoomStore } from './fetchRooms';
import { useInRoomStore } from './inRoom';
import { AppInitStates, useInitsStore } from './inits';
import { useMyStreamStore } from './myStream';
import { useSettingsStore } from './settings';
import { useUserStore } from './user';

const NAMESPACE = 'Widget';

// Opened by the home-screen widget's "Join" button (same scheme on both
// platforms: AndroidManifest intent-filter / iOS CFBundleURLSchemes)
const JOIN_URL = 'com.galaxy.mobile://join';
// A widget tap may land on the permissions or login screen first; give up
// after this so a forgotten request doesn't auto-join much later
const PENDING_JOIN_TTL = 5 * 60 * 1000;

type WidgetSnapshot = {
  room: string;
  isInRoom: boolean;
  isMicOn: boolean;
  isCammute: boolean;
  isAudioMode: boolean;
};

type WidgetState = {
  joinRequestedAt: number;
  handleUrl: (url: string | null) => void;
  tryPendingJoin: () => void;
  applyPending: (fromInit?: boolean) => Promise<void>;
  init: () => () => void;
};

const EMPTY: WidgetSnapshot = {
  room: '',
  isInRoom: false,
  isMicOn: false,
  isCammute: true,
  isAudioMode: false,
};

let lastPushed = '';
// Set while applyPending changes several stores, so intermediate states
// aren't pushed (the widget would flicker)
let isApplying = false;

const isReady = () =>
  useInitsStore.getState().appInitState === AppInitStates.READY;

const collect = (): WidgetSnapshot | null => {
  // Explicit logout (null, not the initial undefined) hides the room
  if (useUserStore.getState().user === null) return EMPTY;
  // Before init the stores hold defaults, not the user's settings
  if (!isReady()) return null;

  const room = useRoomStore.getState().room;
  if (!room) return null;

  return {
    room: room.description || '',
    isInRoom: useInRoomStore.getState().isInRoom,
    isMicOn: !useMyStreamStore.getState().mute,
    isCammute: useMyStreamStore.getState().cammute,
    isAudioMode: useSettingsStore.getState().audioMode,
  };
};

// Store subscriptions fire on every change; only call native when the
// widget-visible state actually changed
const push = () => {
  if (isApplying) return;
  const snapshot = collect();
  if (!snapshot) return;

  const key = JSON.stringify(snapshot);
  if (key === lastPushed) return;
  lastPushed = key;

  try {
    const { room, isInRoom, isMicOn, isCammute, isAudioMode } = snapshot;
    NativeWidgetModule?.setState(
      room,
      isInRoom,
      isMicOn,
      isCammute,
      isAudioMode
    );
  } catch (error) {
    logger.error(NAMESPACE, 'setState', error);
  }
};

const onWidgetAction = (handler: () => void) => {
  if (!NativeWidgetModule) return null;
  if (Platform.OS === 'ios') {
    return new NativeEventEmitter(
      NativeWidgetModule as unknown as NativeModule
    ).addListener('widgetAction', handler);
  }
  return NativeWidgetModule.widgetAction(handler);
};

export const useWidgetStore = create<WidgetState>((set, get) => ({
  joinRequestedAt: 0,

  handleUrl: url => {
    if (!url?.startsWith(JOIN_URL)) return;

    logger.info(NAMESPACE, 'join requested from widget');
    set({ joinRequestedAt: Date.now() });
    get().tryPendingJoin();
  },

  // Called on the widget deep link and whenever the room is (re)selected;
  // joins once the app is initialized and the saved room is restored
  tryPendingJoin: () => {
    const { joinRequestedAt } = get();
    if (!joinRequestedAt) return;

    if (Date.now() - joinRequestedAt > PENDING_JOIN_TTL) {
      logger.debug(NAMESPACE, 'pending join expired');
      set({ joinRequestedAt: 0 });
      return;
    }

    if (useInRoomStore.getState().isInRoom) {
      set({ joinRequestedAt: 0 });
      return;
    }

    if (!isReady() || !useRoomStore.getState().room) {
      logger.debug(NAMESPACE, 'pending join waits for init/room');
      return;
    }

    set({ joinRequestedAt: 0 });
    logger.info(NAMESPACE, 'joining room from widget');
    useInRoomStore.getState().safeJoinRoom();
  },

  // Applies toggles made on the widget: through the stores when the app is
  // initialized, otherwise (only from settingsFromStorage) into storage right
  // before it's read. Before init they stay pending for that call.
  applyPending: async (fromInit = false) => {
    if (!NativeWidgetModule) return;
    if (!isReady() && !fromInit) return;

    let changes;
    try {
      changes = await NativeWidgetModule.consumePending();
    } catch (error) {
      logger.error(NAMESPACE, 'consumePending', error);
      return;
    }
    if (!changes?.pending) return;

    const { isMicOn, isCammute, isAudioMode } = changes;
    logger.info(NAMESPACE, 'applying widget changes', changes);

    if (!isReady()) {
      await setToStorage(STORAGE_KEYS.CAMMUTE, isCammute.toString());
      await setToStorage(STORAGE_KEYS.IS_AUDIO_MODE, isAudioMode.toString());
      return;
    }

    isApplying = true;
    try {
      // Leaving audio mode restores the camera from storage, so store first
      await setToStorage(STORAGE_KEYS.CAMMUTE, isCammute.toString());

      const { audioMode, toggleAudioMode } = useSettingsStore.getState();
      if (audioMode !== isAudioMode) {
        await toggleAudioMode(isAudioMode);
      }

      const { mute, cammute, toggleMute, toggleCammute } =
        useMyStreamStore.getState();
      if (cammute !== isCammute) {
        await toggleCammute(isCammute);
      }
      if (useInRoomStore.getState().isInRoom && mute === isMicOn) {
        toggleMute(!isMicOn);
      }
    } finally {
      isApplying = false;
    }

    // The widget shows the requested values until the real state is pushed
    lastPushed = '';
    push();
  },

  init: () => {
    Linking.getInitialURL()
      .then(get().handleUrl)
      .catch(error => logger.error(NAMESPACE, 'getInitialURL', error));
    const linkSub = Linking.addEventListener('url', ({ url }) =>
      get().handleUrl(url)
    );

    const actionSub = onWidgetAction(() => get().applyPending());
    // iOS widget toggles run in the extension; also catch up on resume
    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') get().applyPending();
    });

    const unsubscribers = [
      useRoomStore,
      useInRoomStore,
      useMyStreamStore,
      useSettingsStore,
      useInitsStore,
      useUserStore,
    ].map(store => store.subscribe(push));

    return () => {
      linkSub.remove();
      actionSub?.remove();
      appStateSub.remove();
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  },
}));
