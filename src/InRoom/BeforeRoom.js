import React, { useEffect } from 'react';

import 'intl-pluralrules';
import 'react-native-url-polyfill';

import '../i18n/i18n';
import Room from './Room';

import WIP from '../components/WIP';
import RequiredUpdate from '../services/RequiredUpdate';
import logger from '../services/logger';
import { SettingsNotJoined } from '../settings/SettingsNotJoined';
import { useInRoomStore } from '../zustand/inRoom';
import { useInitsStore } from '../zustand/inits';
import { useVersionStore } from '../zustand/version';
const NAMESPACE = 'BeforeRoom';

const BeforeRoom = () => {
  const { forceUpdate } = useVersionStore();
  const isInRoom = useInRoomStore(state => state.isInRoom);
  const isAppInited = useInitsStore(state => state.isAppInited);
  const wip = useInitsStore(state => state.wip);
  const initApp = useInitsStore(state => state.initApp);
  const terminateApp = useInitsStore(state => state.terminateApp);

  logger.debug(NAMESPACE, 'render', isInRoom, isAppInited, wip);
  useEffect(() => {
    logger.debug(NAMESPACE, 'useEffect', isAppInited, wip);
    initApp();
    return () => {
      logger.debug(NAMESPACE, 'useEffect terminateApp');
      terminateApp();
    };
  }, []);

  if (!isAppInited || wip) {
    logger.debug(NAMESPACE, '!isAppInited');
    return <WIP isReady={false} />;
  }

  if (forceUpdate) {
    logger.debug(NAMESPACE, 'forceUpdate');
    return <RequiredUpdate />;
  }

  if (!isInRoom) {
    logger.debug(NAMESPACE, '!isInRoom');
    return <SettingsNotJoined />;
  }

  return <Room />;
};

export default BeforeRoom;
