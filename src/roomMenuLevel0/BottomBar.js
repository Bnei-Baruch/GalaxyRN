import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { baseStyles } from '../constants';
import { useSettingsStore } from '../zustand/settings';
import { useUiActions } from '../zustand/uiActions';
import { AudioModeBtn } from './bottomBarBtns/AudioModeBtn';
import { CammuteBtn } from './bottomBarBtns/CammuteBtn';
import { MoreBtn } from './bottomBarBtns/MoreBtn';
import { MuteBtn } from './bottomBarBtns/MuteBtn';
import { QuestionBtn } from './bottomBarBtns/QuestionBtn';
import { ShidurVideoBtn } from './bottomBarBtns/ShidurVideoBtn';
import AudioSelectBtn from '../roomMenuLevel1/btns/audioSelect/AudioSelectBtn';
import { SubtitleBtn } from '../roomMenuLevel1/btns/SubtitleBtn';
import { TranslationBtn } from '../roomMenuLevel1/btns/TranslationBtn';

export const BottomBar = () => {
  const insets = useSafeAreaInsets();
  const { cancelHideBarsTimeout } = useUiActions();
  const isTen = useSettingsStore(state => state.isTen);

  return (
    <View
      onTouchStart={cancelHideBarsTimeout}
      style={[
        styles.container,
        baseStyles.panelBackground,
        {
          marginBottom:
            insets.bottom +
            (require('react-native').Platform.OS === 'android' ? 8 : 0),
          marginLeft: insets.left + 8,
          marginRight: insets.right + 8,
        },
      ]}
    >
      {isTen ? (
        <>
          <MuteBtn />
          <CammuteBtn />
          <QuestionBtn />
          <AudioModeBtn />
        </>
      ) : (
        // Broadcast-only: no mic/camera, broadcast controls instead
        <>
          <TranslationBtn showtext={false} />
          <SubtitleBtn showtext={false} />
          <AudioSelectBtn showtext={false} />
          <ShidurVideoBtn />
        </>
      )}
      <View style={styles.devider}></View>
      <MoreBtn />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 340,
    maxWidth: '100%',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 32,
  },
  devider: {
    width: 1,
    backgroundColor: '#333',
    marginLeft: 4,
    marginRight: 4,
    marginTop: 16,
    marginBottom: 16,
  },
});
