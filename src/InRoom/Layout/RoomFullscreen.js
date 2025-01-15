import React, { useEffect, useState } from 'react';
import Orientation from 'react-native-orientation-locker';
import GestureRecognizer from 'react-native-swipe-gestures';
import { View } from 'react-native';
import { baseStyles } from '../../constants';

const RoomFullscreen = ({ shidur, quads, members }) => {
  const [content, setContent] = useState(shidur);

  useEffect(() => {
    Orientation.lockToLandscapeRight();
    return Orientation.unlockAllOrientations;
  }, []);
  const handleSwipe = (direction, state) => {
    direction === 'down' && setContent(members);
    direction === 'up' && setContent(quads);
  };

  return (

    <GestureRecognizer onSwipe={handleSwipe}>
      <View style={baseStyles.full}>
        {content}
      </View>
    </GestureRecognizer>
  );
};
export default RoomFullscreen;
