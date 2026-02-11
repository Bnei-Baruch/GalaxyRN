import { NativeModules } from 'react-native';
import { useRoomStore } from '../zustand/fetchRooms';
import { useInRoomStore } from '../zustand/inRoom';
import { useMyStreamStore } from '../zustand/myStream';
import logger from './logger';

const NAMESPACE = 'ForegroundBridge';

const NativeForeground = NativeModules.ForegroundModule;
const collectData = () => {
  const isMicOn = !useMyStreamStore.getState().mute;
  const isInRoom = useInRoomStore.getState().isInRoom;
  const room = useRoomStore.getState().room?.description || 'Not in room';
  logger.debug(NAMESPACE, 'collectData: isMicOn: ' + isMicOn + ' isInRoom: ' + isInRoom + ' room: ' + room);
  return { isMicOn, isInRoom, room };
};
const ForegroundBridge = {
  startForegroundListener: async () => {
    if (NativeForeground && NativeForeground.startForegroundListener) {
      return await NativeForeground.startForegroundListener();
    } else {
      logger.warn(NAMESPACE, 'startForegroundListener is not available');
      return false;
    }
  },
  updateForegroundService: () => {
    logger.debug(NAMESPACE, 'updateForegroundService');
    if (NativeForeground && NativeForeground.updateForegroundService) {
      const { isMicOn, isInRoom, room } = collectData();
      logger.debug(NAMESPACE, 'updateForegroundService: isMicOn: ' + isMicOn + ' isInRoom: ' + isInRoom + ' room: ' + room);
      NativeForeground.updateForegroundService(isMicOn, isInRoom, room);
    } else {
      logger.warn(NAMESPACE, 'updateForegroundService is not available');
    }
  },
  raw: NativeForeground,
};

export default ForegroundBridge;
