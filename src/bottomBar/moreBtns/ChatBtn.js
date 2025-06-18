import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ChatCounter } from '../../chat/ChatCounter';
import { ChatModal } from '../../chat/ChatModal';
import { baseStyles } from '../../constants';
import IconWithText from '../../settings/IconWithText';
import { useChatStore } from '../../zustand/chat';
import { modalModes } from '../../zustand/helper';

export const ChatBtn = () => {
  const { setChatMode } = useChatStore();
  const { t } = useTranslation();
  const handlePress = () => setChatMode(modalModes.chat);

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        style={[baseStyles.listItem, styles.container]}
      >
        <View style={styles.leftBlock}>
          <ChatCounter />
          <IconWithText iconName="forum" text={t('bottomBar.chat')} />
        </View>
        <View style={styles.divider}></View>
      </TouchableOpacity>
      <ChatModal />
    </>
  );
};

const styles = StyleSheet.create({
  divider: {
    flex: 1,
  },
  container: {
    flexDirection: 'row',
  },
  leftBlock: {
    paddingRight: 15,
  },
});
