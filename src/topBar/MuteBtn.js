import * as React from 'react';
import { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAudioDevicesStore from '../zustand/audioDevices';

export const MuteBtn = () => {
  const [open, setOpen]                            = useState();
  const { selected, select, devices, init, abort } = useAudioDevicesStore();
  useEffect(() => {
    init();
    return () => {
      abort();
    };
  }, []);

  const toggleOpen = () => setOpen(!open);

  const handleSelect = (d) => {
    select(d);
    setOpen(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleSelect(item.name)}>
      <Icon
        name={item.icon}
        size={30}
        color="white"
      />
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity onPress={toggleOpen}>
        <Icon
          name={selected?.icon}
          size={30}
          color="white"
          style={{ marginHorizontal: 5 }}
        />
      </TouchableOpacity>
      <View>
        {devices.map(renderItem)}
      </View>
    </View>
  );
};
