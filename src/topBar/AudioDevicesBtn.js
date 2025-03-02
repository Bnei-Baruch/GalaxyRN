import * as React from 'react';
import { useState } from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAudioDevicesStore from '../zustand/audioDevices';
import { baseStyles } from '../constants';
import ListInModal from '../components/ListInModal';

export const AudioDevicesBtn = () => {
  const [open, setOpen]               = useState();
  const { selected, select, devices } = useAudioDevicesStore();

  if (!selected) return null;

  const toggleOpen = () => setOpen(!open);

  const handleSelect = id => {
    setOpen(false);
    select(id);
  };

  const renderItem = (item) => {
    if (!item)
      return null;

    return (
      <TouchableOpacity
        disabled={item.active}
        key={item.id}
        style={[styles.item, { opacity: item.active ? 0.5 : 1 }]}
        onPress={() => handleSelect(item.id)}>
        <Icon
          name={item.icon}
          size={30}
          color="white"
        />
        <Text style={baseStyles.text}>{item.typeStr}</Text>
        <Text style={baseStyles.text}>{item.type}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ListInModal
      onOpen={toggleOpen}
      items={devices}
      renderItem={renderItem}
      trigger={
        <Icon
          name={selected.icon}
          size={30}
          color="white"
        />
      }
    />
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
  },
  item     : {
    flexWrap     : 'nowrap',
    flexDirection: 'row',
    alignItems   : 'center',
    padding      : 5
  }
});