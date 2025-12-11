import React from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AudioBridge from '../../services/AudioBridge';
import useAudioDevicesStore from '../../zustand/audioDevices';
import { bottomBar } from '../helper';
import BottomBarIconWithText from '../../settings/BottomBarIconWithTextAnimated';

export const SwitchDeviceBtn = () => {
  const { selected, wip } = useAudioDevicesStore();

  const handleSwitch = () => AudioBridge.switchAudioOutput();
 const { t } = useTranslation();
  if (!selected) return null;

  return (
    <Pressable onPress={handleSwitch} disabled={wip} style={bottomBar.btn}>
      <BottomBarIconWithText
        iconName={selected.icon}
        text={t('bottomBar.audioSource')}
        
        extraStyle={wip ? ['rest_disabled','rest_disabled_icon']:['rest', 'resticon']}
        showtext={true}
        direction={['horizontal','horizontal']}
      />
    </Pressable>
  );
};
