import React, { useEffect } from 'react';
import { Quads } from '../../shidur/Quads';
import Shidur from '../../shidur/Shidur';
import { useInitsStore } from '../../zustand/inits';
import { useSettingsStore } from '../../zustand/settings';
import { useShidurStore } from '../../zustand/shidur';
import Feeds from '../Feeds/Feeds';
import RoomFullscreen from './RoomFullscreen';
import RoomLandscape from './RoomLandscape';
import RoomPortrait from './RoomPortrait';

const RoomLayout = () => {
  const { isPortrait } = useInitsStore();
  const { isShidur, showGroups, isFullscreen } = useSettingsStore();
  const { cleanJanus, initJanus, initAudio } = useShidurStore();

  useEffect(() => {
    initAudio();
    initJanus();
    return () => {
      cleanJanus();
    };
  }, []);

  const shidur = isShidur && <Shidur />;
  const quads = showGroups && <Quads />;
  const members = <Feeds key="members" />;

  if (isFullscreen)
    return <RoomFullscreen shidur={shidur} quads={quads} members={members} />;

  if (isPortrait)
    return <RoomPortrait shidur={shidur} quads={quads} members={members} />;

  return <RoomLandscape shidur={shidur} quads={quads} members={members} />;
};
export default RoomLayout;
