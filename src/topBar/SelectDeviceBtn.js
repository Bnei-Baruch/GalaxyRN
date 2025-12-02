import * as React from 'react';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTranslation } from 'react-i18next';
import Text from '../components/CustomText';
import ListInModal from '../components/ListInModal';
import { baseStyles } from '../constants';
import logger from '../services/logger';
import { useAudioDevicesStore } from '../zustand/audioDevices';

const NAMESPACE = 'SelectDeviceBtn';

export const SelectDeviceBtn = () => {
  const [open, setOpen] = useState();
  const { selected, select, devices } = useAudioDevicesStore();
  const { t } = useTranslation();

  if (!selected) {
    logger.debug(NAMESPACE, 'SelectDeviceBtn no selected device');
    return null;
  }

  const toggleOpen = () => setOpen(!open);

  const handleSwitch = id => {
    const index = devices.findIndex(device => device.id === id);
    const nextIndex = (index + 1) % devices.length || 0;
    select(devices[nextIndex].id);
  };

  const handleSelect = id => {
    logger.debug(NAMESPACE, 'SelectDeviceBtn handleSelect', id);
    setOpen(false);
    select(id);
  };

  const renderItem = item => {
    if (!item) return null;

    return (
      <TouchableOpacity
        disabled={item.active}
        key={item.id}
        style={[styles.item, { opacity: item.active ? 0.5 : 1 }]}
        onPress={() => handleSelect(item.id)}
      >
        <Icon name={item.icon} size={30} color="white" />
        <Text style={baseStyles.text}>{t(`audioDeviceName.${item.type}`)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => handleSwitch(selected.id)}>
        <Icon name={selected.icon} size={30} color="white" />
      </TouchableOpacity>
      <ListInModal
        onOpen={toggleOpen}
        items={devices}
        renderItem={renderItem}
        trigger={<Icon name="arrow-drop-down" size={30} color="white" />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  select: {
    padding: 4,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  item: {
    flexWrap: 'nowrap',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
});
