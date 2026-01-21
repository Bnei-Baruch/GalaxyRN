import React from 'react';

import logger from '../../services/logger';
import { KliOlami } from '../../shidur/KliOlami';
import Shidur from '../../shidur/Shidur';
import { useInitsStore } from '../../zustand/inits';
import { useSettingsStore } from '../../zustand/settings';
import Feeds from '../Feeds/Feeds';
import KliOlamiFullscreen from './KliOlamiFullscreen';
import RoomFullscreen from './RoomFullscreen';
import RoomLandscape from './RoomLandscape';
import RoomPortrait from './RoomPortrait';

const NAMESPACE = 'RoomLayout';

const RoomLayout = () => {
  const { isPortrait } = useInitsStore();
  const { isShidur, isKliOlami, isFullscreen, isKliOlamiFullscreen } = useSettingsStore();

  const shidur = isShidur && <Shidur />;
  const kliOlami = isKliOlami && <KliOlami />;
  const members = <Feeds key="members" />;

  logger.debug(NAMESPACE, 'render');

  if (isFullscreen) {
    return <RoomFullscreen shidur={shidur} />;
  } else if (isKliOlamiFullscreen) {
    return <KliOlamiFullscreen kliOlami={kliOlami} />;
  } else if (isPortrait) {
    return <RoomPortrait shidur={shidur} kliOlami={kliOlami} members={members} />;
  }

  return <RoomLandscape shidur={shidur} kliOlami={kliOlami} members={members} />;
};
export default RoomLayout;
