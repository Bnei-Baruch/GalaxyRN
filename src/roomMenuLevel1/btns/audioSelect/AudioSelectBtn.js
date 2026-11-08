import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import logger from '../../../services/logger';
import BottomBarIconWithText from '../../../settings/BottomBarIconWithText';
import { useShidurStore } from '../../../zustand/shidur';
import { bottomBar } from '../../../roomMenuLevel0/helper';

const NAMESPACE = 'AudioSelectBtn';

// The modal is mounted once in Room, so this button can live in several bars
const AudioSelectBtn = ({ showtext = true }) => {
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
          extraStyle={['rest', 'rest_icon']}
          showtext={showtext}
          direction={['vertical', 'horizontal']}
        />
      </Pressable>
    </View>
  );
};
export default AudioSelectBtn;
