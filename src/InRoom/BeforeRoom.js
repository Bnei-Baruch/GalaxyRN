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
import { AppInitStates, useInitsStore } from '../zustand/inits';
import { useVersionStore } from '../zustand/version';

const NAMESPACE = 'BeforeRoom';

const BeforeRoom = () => {
  const { forceUpdate } = useVersionStore();
  const isInRoom = useInRoomStore(state => state.isInRoom);
  const appInitState = useInitsStore(state => state.appInitState);
  const wip = useInitsStore(state => state.wip);
  const initApp = useInitsStore(state => state.initApp);
  const terminateApp = useInitsStore(state => state.terminateApp);

  useEffect(() => {
    logger.debug(NAMESPACE, 'useEffect');
    initApp();
    return () => {
      logger.debug(NAMESPACE, 'useEffect terminateApp');
      terminateApp();
    };
  }, []);

  logger.debug(NAMESPACE, 'appInitState', appInitState, wip);

  if (appInitState === AppInitStates.NOT_JOINED || wip) {
    logger.debug(NAMESPACE, '!appInitState');
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
