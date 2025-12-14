import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import logger from '../../../services/logger';
import BottomBarIconWithText from '../../../settings/BottomBarIconWithTextAnimated';
import { useShidurStore } from '../../../zustand/shidur';
import { bottomBar } from '../../helper';
import AudioSelectModal from './AudioSelectModal';

const NAMESPACE = 'AudioSelectBtn';

const AudioSelectBtn = () => {
  const { audio, setIsAudioSelectOpen } = useShidurStore();

  const { t } = useTranslation();
  const handlePress = () => {
    logger.debug(NAMESPACE, 'handlePress');
    setIsAudioSelectOpen(true);
  };

  return (
    <View style={bottomBar.btn}>
      <Pressable onPress={handlePress}>
        <BottomBarIconWithText
          iconName="record-voice-over"
          text={t(audio.text) + ' - ' + t(audio.description)}
          extraStyle={['rest', 'resticon']}
          showtext={true}
          direction={['vertical', 'vertical']}
        />
      </Pressable>

      <AudioSelectModal />
    </View>
  );
};
export default AudioSelectBtn;
