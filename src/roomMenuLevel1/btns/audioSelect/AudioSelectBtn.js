import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import logger from '../../../services/logger';
import BottomBarIconWithText from '../../../settings/BottomBarIconWithText';
import { useShidurStore } from '../../../zustand/shidur';
import { bottomBar } from '../../../roomMenuLevel0/helper';
import AudioSelectModal from './AudioSelectModal';

const NAMESPACE = 'AudioSelectBtn';

// Each instance owns its modal (local state, like VideoSelect/ListInModal), so
// the button can live in several bars without instances fighting over a flag.
const AudioSelectBtn = ({ showtext = true, testID = 'audioSelectBtn' }) => {
  const audio = useShidurStore(state => state.audio);
  const [isOpen, setIsOpen] = useState(false);

  const { t } = useTranslation();
  const handlePress = () => {
    logger.debug(NAMESPACE, 'handlePress');
    setIsOpen(true);
  };
  const handleClose = () => setIsOpen(false);

  return (
    <View style={bottomBar.btn}>
      <Pressable testID={testID} onPress={handlePress}>
        <BottomBarIconWithText
          iconName="record-voice-over"
          text={t(audio.text) + ' - ' + t(audio.description)}
          extraStyle={['rest', 'rest_icon']}
          showtext={showtext}
          direction={['vertical', 'horizontal']}
        />
      </Pressable>
      <AudioSelectModal visible={isOpen} onClose={handleClose} />
    </View>
  );
};
export default AudioSelectBtn;
