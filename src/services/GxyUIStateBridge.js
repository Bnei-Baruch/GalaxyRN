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
  startForegroundListener: async () => {
    if (NativeGxyUIState && NativeGxyUIState.startForegroundListener) {
      return await NativeGxyUIState.startForegroundListener();
    } else {
      logger.warn(NAMESPACE, 'startForegroundListener is not available');
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
