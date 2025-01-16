import * as React from 'react';
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
import { useShidurStore } from '../zustand/shidur';
import { useInitsStore } from '../zustand/inits';

export const SettingsNotJoinedLandscape = () => {
  const { t }                                    = useTranslation();
  const { cammute, toggleCammute }               = useMyStreamStore();
  const { isShidur, audioMode, toggleAudioMode } = useSettingsStore();
  const { user }                                 = useUserStore();
  const { setIsMuted }                           = useShidurStore();
  const { isPortrait }                           = useInitsStore();

  const handleToggleAudioMode = () => toggleAudioMode();
  const handleIsMuted         = () => setIsMuted();
  const handleCammute         = () => toggleCammute();

  return (
    <View style={styles.container}>
      <PageHeader page={t('settings.page')} />
      {/*user settings*/}
      <View style={styles.forms}>
        <View style={styles.row}>
          <IconWithText iconName="account-circle" text={t('user.title')} />
          <LabeledInput label={t('user.name')} value={user.display} disabled={true} />
          <MyVideo />
        </View>
        <View style={styles.row}>
          <SelectUiLanguage />

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
            onValueChange={handleIsMuted}
          />

          <RoomSelect />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding        : 3,
    flex           : 1,
    backgroundColor: 'black',
  },
  forms    : {
    flex         : 1,
    flexDirection: 'row',
    flexWrap     : 'wrap',
  },
  row      : {
    flex   : 1,
    padding: 10
  }
});
