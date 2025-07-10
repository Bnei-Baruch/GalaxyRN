import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AudioBridge from '../services/AudioBridge';
import useAudioDevicesStore from '../zustand/audioDevices';

export const SwitchDeviceBtn = () => {
  const { selected, wip } = useAudioDevicesStore();

  const handleSwitch = () => AudioBridge.switchAudioOutput();

  if (!selected) return null;

  return (
    <TouchableOpacity onPress={handleSwitch} disabled={wip}>
      <Icon name={selected.icon} size={30} color={wip ? 'gray' : 'white'} />
    </TouchableOpacity>
  );
};
