import * as React from 'react';
import { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { bottomBar } from './helper';

export const MoreBtn = () => {
  const { open, setOpen } = useState();

  const handlePress = () => setOpen(!open);

  return (
    <>
      <TouchableOpacity onPress={handlePress} style={bottomBar.btn}>
        <Icon name="more-vert" size={40} color="grey" />
      </TouchableOpacity>
    </>
  );
};
