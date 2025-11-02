import React from 'react';

import logger from '../../services/logger';
import { Quads } from '../../shidur/Quads';
import Shidur from '../../shidur/Shidur';
import { useInitsStore } from '../../zustand/inits';
import { useSettingsStore } from '../../zustand/settings';
import Feeds from '../Feeds/Feeds';
import RoomFullscreen from './RoomFullscreen';
import RoomLandscape from './RoomLandscape';
import RoomPortrait from './RoomPortrait';

const NAMESPACE = 'RoomLayout';

const RoomLayout = () => {
  const { isPortrait } = useInitsStore();
  const { isShidur, showGroups, isFullscreen } = useSettingsStore();

  const shidur = isShidur && <Shidur />;
  const quads = showGroups && <Quads />;
  const members = <Feeds key="members" />;

  logger.debug(NAMESPACE, 'render');

  if (isFullscreen)
    return <RoomFullscreen shidur={shidur} quads={quads} members={members} />;
  else if (isPortrait)
    return <RoomPortrait shidur={shidur} quads={quads} members={members} />;

  return <RoomLandscape shidur={shidur} quads={quads} members={members} />;
};
export default RoomLayout;
