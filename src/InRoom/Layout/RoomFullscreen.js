import React, { useState } from 'react';
import GestureRecognizer from 'react-native-swipe-gestures';
import { View } from 'react-native';
import { baseStyles } from '../../constants';

const RoomFullscreen = ({ shidur, quads, members }) => {
  const [content, setContent] = useState(shidur);

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
