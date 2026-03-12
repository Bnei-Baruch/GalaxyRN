import { NativeModules } from 'react-native';
import { useRoomStore } from '../zustand/fetchRooms';
import { useInRoomStore } from '../zustand/inRoom';
import { useMyStreamStore } from '../zustand/myStream';
import logger from './logger';

const NAMESPACE = 'GxyUIStateBridge';

const NativeGxyUIState = NativeModules.GxyUIStateModule;
const collectData = () => {
  const isMicOn = !useMyStreamStore.getState().mute;
  const isInRoom = useInRoomStore.getState().isInRoom;
  const room = useRoomStore.getState().room?.description || 'Not in room';
  const isCammute = useMyStreamStore.getState().cammute;
  logger.debug(NAMESPACE, 'collectData: isMicOn: ' + isMicOn + ' isInRoom: ' + isInRoom + ' room: ' + room + ' isCammute: ' + isCammute);
  return { isMicOn, isInRoom, room, isCammute };
};

const GxyUIStateBridge = {
  startForeground: async () => {
    if (NativeGxyUIState && NativeGxyUIState.startForeground) {
      return await NativeGxyUIState.startForeground();
    } else {
      logger.warn(NAMESPACE, 'startForeground is not available');
      return false;
    }
  },
  stopForeground: async () => {
    if (NativeGxyUIState && NativeGxyUIState.stopForeground) {
      return await NativeGxyUIState.stopForeground();
    } else {
      logger.warn(NAMESPACE, 'stopForeground is not available');
      return false;
    }
  },

  updateUIState: () => {
    logger.debug(NAMESPACE, 'updateUIState');
    if (NativeGxyUIState && NativeGxyUIState.updateUIState) {
      const { isMicOn, isInRoom, room, isCammute } = collectData();
      NativeGxyUIState.updateUIState(isMicOn, isInRoom, room, isCammute);
    } else {
      logger.warn(NAMESPACE, 'updateUIState is not available');
    }
  },

  activatePip: async () => {
    if (NativeGxyUIState && NativeGxyUIState.activatePip) {
      return await NativeGxyUIState.activatePip();
    } else {
      logger.warn(NAMESPACE, 'activatePip is not available');
      return false;
    }
  },
  raw: NativeGxyUIState,
};

export default GxyUIStateBridge;
