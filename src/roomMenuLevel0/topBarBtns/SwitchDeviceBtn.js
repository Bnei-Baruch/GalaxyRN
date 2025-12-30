import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import AudioBridge from '../../services/AudioBridge';
import BottomBarIconWithText from '../../settings/BottomBarIconWithText';
import { useAudioDevicesStore } from '../../zustand/audioDevices';
import { bottomBar } from '../helper';

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
        extraStyle={
          wip ? ['rest_disabled', 'rest_disabled_icon'] : ['rest', 'resticon']
        }
        showtext={[ false, true ]}
        direction={['horizontal', 'horizontal']}
      />
    </Pressable>
  );
};
