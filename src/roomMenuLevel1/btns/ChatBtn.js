import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { ChatCounter } from '../../chat/ChatCounter';
import { ChatModal } from '../../chat/ChatModal';
import BottomBarIconWithText from '../../settings/BottomBarIconWithText';
import { useChatStore } from '../../zustand/chat';
import { useCrispStore } from '../../zustand/crisp';
import { modalModes } from '../../zustand/helper';
import { useSettingsStore } from '../../zustand/settings';
import { bottomBar } from '../../roomMenuLevel0/helper';
export const ChatBtn = () => {
  const { setChatMode } = useChatStore();
  const { start: openSupport } = useCrispStore();
  const isTen = useSettingsStore(state => state.isTen);
  const { t } = useTranslation();
  // Room chat and questions both belong to the ten; broadcast-only only has
  // support, so skip the tabbed modal and open it directly.
  const handlePress = () =>
    isTen ? setChatMode(modalModes.chat) : openSupport();
  return (
    <>
      <Pressable testID="chatBtn" onPress={handlePress} style={bottomBar.btn}>
        <BottomBarIconWithText
          iconName="chat"
          text={t('bottomBar.chat')}
          extraStyle={['rest', 'rest_icon']}
          showtext={[true, false]}
          direction={['horizontal', 'horizontal']}
        />
        <ChatCounter />
      </Pressable>
      <ChatModal />
    </>
  );
};
