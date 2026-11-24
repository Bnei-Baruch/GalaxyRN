import React from 'react';

import logger from '../../services/logger';
import { KliOlami } from '../../shidur/KliOlami';
import Shidur from '../../shidur/Shidur';
import { useInitsStore } from '../../zustand/inits';
import { useScreenShareStore } from '../../zustand/screenShare';
import { useSettingsStore } from '../../zustand/settings';
import Feeds from '../Feeds/Feeds';
import ScreenShareView, { ScreenShareNotice } from '../ScreenShareView';
import KliOlamiFullscreen from './KliOlamiFullscreen';
import RoomFullscreen from './RoomFullscreen';
import RoomLandscape from './RoomLandscape';
import RoomPortrait from './RoomPortrait';

const NAMESPACE = 'RoomLayout';

const RoomLayout = () => {
  const { isPortrait } = useInitsStore();
  const { isShidur, isTen, isKliOlami, isFullscreen, isKliOlamiFullscreen } =
    useSettingsStore();

  const panelSource = useScreenShareStore(state => state.panelSource);

  // A shared screen replaces the broadcast (and Kli Olami) in the panel; the
  // broadcast button switches the panel between the two.
  const isScreen = panelSource === 'screen';
  let shidur = isShidur && <Shidur />;
  if (isScreen) {
    shidur = <ScreenShareView />;
  } else if (shidur && panelSource === 'broadcast' && !isFullscreen) {
    shidur = (
      <>
        <ScreenShareNotice />
        {shidur}
      </>
    );
  }
  const kliOlami = isKliOlami && !isScreen && <KliOlami />;
  const members = isTen && <Feeds key="members" />;

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
