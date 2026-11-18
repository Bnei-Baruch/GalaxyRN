import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from '../components/CustomText';
import { baseStyles } from '../constants';
import { FullscreenBtn } from '../shidur/FullscreenBtn';
import ShidurMemoized from '../shidur/ShidurMemoized';
import commonStyles from '../shidur/style';
import { useScreenShareStore } from '../zustand/screenShare';
import { useSettingsStore } from '../zustand/settings';
import { useUiActions } from '../zustand/uiActions';

// A screen shared by a room member, shown in place of the broadcast panel.
const ScreenShareView = () => {
  const { t } = useTranslation();
  const screenUrl = useScreenShareStore(state => state.screenUrl);
  const name = useScreenShareStore(state => state.screenFeed?.display?.display);
  const videoOff = useScreenShareStore(state => state.videoOff);
  // A share may carry sound only: it still takes the panel.
  const noVideo = useScreenShareStore(
    state => !!state.screenFeed && !state.screenFeed.vMid
  );
  const audioMode = useSettingsStore(state => state.audioMode);
  const showBars = useUiActions(state => state.showBars);

  const audioOnly = videoOff || audioMode || noVideo;

  let content;
  if (audioOnly) {
    content = <Icon name="graphic-eq" color="white" size={70} />;
  } else if (screenUrl) {
    content = <ShidurMemoized streamURL={screenUrl} style={styles.video} />;
  } else {
    content = (
      <>
        <ActivityIndicator size="large" color="grey" />
        <Text style={[baseStyles.text, styles.connecting]}>
          {t('screenShare.connecting')}
        </Text>
      </>
    );
  }

  return (
    <View style={styles.container}>
      {content}

      {!!name && (
        <Text style={[baseStyles.text, styles.label]} numberOfLines={1}>
          {t('screenShare.sharedScreenOf', { name })}
        </Text>
      )}

      {showBars && (
        <View style={[commonStyles.toolbar, styles.toolbar]}>
          <View style={commonStyles.toolbarBtnsGroup}>
            <FullscreenBtn />
          </View>
        </View>
      )}
    </View>
  );
};

// Shown above the broadcast while somebody shares a screen and the user
// switched the panel back to the broadcast.
export const ScreenShareNotice = () => {
  const { t } = useTranslation();
  const name = useScreenShareStore(state => state.screenFeed?.display?.display);
  const hasScreen = useScreenShareStore(state => !!state.screenFeed);
  const showSharedScreen = useScreenShareStore(state => state.showSharedScreen);

  if (!hasScreen) return null;

  return (
    <Pressable onPress={showSharedScreen} style={styles.notice}>
      <Icon name="screen-share" color="white" size={20} />
      <Text style={[baseStyles.text, styles.noticeText]} numberOfLines={1}>
        {t('screenShare.showSharedScreen', { name: name || '' })}
      </Text>
    </Pressable>
  );
};

export default ScreenShareView;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  connecting: {
    marginTop: 12,
  },
  label: {
    position: 'absolute',
    top: 8,
    left: 8,
    maxWidth: '80%',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  toolbar: {
    justifyContent: 'flex-end',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1565c0',
  },
  noticeText: {
    flex: 1,
    marginLeft: 8,
  },
});
