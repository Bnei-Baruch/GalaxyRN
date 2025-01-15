import * as React from 'react';
import { useEffect } from 'react';
import IconWithText from './IconWithText';
import LabeledInput from './LabeledInput';
import SelectUiLanguage from './SelectUiLanguage';
import MyVideo from '../components/MyVideo';
import LabeledSwitch from './LabeledSwitch';
import { useSettingsStore } from '../zustand/settings';
import RoomSelect from './RoomSelect';
import { useMyStreamStore } from '../zustand/myStream';
import { View, StyleSheet } from 'react-native';
import PageHeader from '../components/PageHeader';
import { useUserStore } from '../zustand/user';
import { useTranslation } from 'react-i18next';
import Orientation from 'react-native-orientation-locker';

export const SettingsNotJoined = () => {
  const { t }                                                    = useTranslation();
  const { cammute, toggleCammute }                               = useMyStreamStore();
  const { isShidur, toggleIsShidur, audioMode, toggleAudioMode } = useSettingsStore();
  const { user }                                                 = useUserStore();

  useEffect(() => {
    Orientation.lockToPortrait();
    return Orientation.unlockAllOrientations;
  }, []);
  const handleToggleAudioMode = () => toggleAudioMode();
  const handleToggleIsShidur  = () => toggleIsShidur();
  const handleCammute         = () => toggleCammute();

  return (
    <View style={styles.container}>
      <PageHeader page={t('settings.page')} />
      {/*user settings*/}
      <IconWithText iconName="account-circle" text={t('user.title')} />
      <LabeledInput label={t('user.name')} value={user.display} disabled={true} />
      <SelectUiLanguage />
      <MyVideo />
      <LabeledSwitch
        label={t('settings.cammute')}
        value={cammute}
        onValueChange={handleCammute}
      />
      <LabeledSwitch
        label={t('settings.audioMode')}
        value={audioMode}
        onValueChange={handleToggleAudioMode}
      />

      <LabeledSwitch
        label={t('settings.isShidur')}
        value={isShidur}
        onValueChange={handleToggleIsShidur}
      />
      <RoomSelect />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding        : 3,
    flex           : 1,
    backgroundColor: 'black',
  },
  landscape: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
  },
  row      : {
    flex: 1,
  },
  selected : {
    borderWidth : 1,
    borderColor : 'rgba(255, 255, 255, 0.23)',
    borderRadius: 5,
    padding     : 10,
    color       : 'white',
  },
});
