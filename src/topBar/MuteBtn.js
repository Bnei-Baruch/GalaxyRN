import * as React from 'react';
import { useEffect, useState } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
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

  if (!selected)
    return null;

  const toggleOpen = () => setOpen(!open);

  const handleSelect = (d) => {
    setOpen(false);
    select(d);
  };

  const renderItem = (item) => {
    if (!item)
      return null;

    return (
      <TouchableOpacity onPress={() => handleSelect(item.key)}>
        <Icon
          name={item.icon}
          size={30}
          color="white"
        />
      </TouchableOpacity>
    );
  };

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
      <View style={styles.select}>
        {open && devices.map(renderItem)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems    : 'center',
    width         : '100%',
    justifyContent: 'center'
  },
  select   : {
    padding        : 4,
    flexDirection  : 'column',
    justifyContent : 'space-between',
    alignItems     : 'center',
    position       : 'absolute',
    top            : '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  }
});