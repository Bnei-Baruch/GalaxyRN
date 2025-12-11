import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { ChatCounter } from '../../chat/ChatCounter';
import { ChatModal } from '../../chat/ChatModal';
import BottomBarIconWithText from '../../settings/BottomBarIconWithTextAnimated';

import { useChatStore } from '../../zustand/chat';
import { modalModes } from '../../zustand/helper';
import { bottomBar } from '../helper';

export const ChatBtn = () => {
  const { setChatMode } = useChatStore();
  const { t } = useTranslation();
  const handlePress = () => setChatMode(modalModes.chat);

  return (
    <>
      <Pressable onPress={handlePress} style={bottomBar.btn}>
        <BottomBarIconWithText
          iconName="chat"
          text={t('bottomBar.chat')}
          extraStyle={['rest', 'resticon']}
          showtext={true}
          direction={['horizontal','horizontal']}
        />
        <ChatCounter />
      </Pressable>
      <ChatModal />
    </>
  );
};
