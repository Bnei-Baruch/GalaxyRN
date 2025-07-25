import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import AccountSettings from '../auth/AccountSettings';
import MyVideo from '../components/MyVideo';
import PageHeader from '../components/PageHeader';
import { baseStyles } from '../constants';
import { useMyStreamStore } from '../zustand/myStream';
import { useSettingsStore } from '../zustand/settings';
import DebugMode from './DebugMode';
import LabeledSwitch from './LabeledSwitch';
import RoomSelect from './RoomSelect';
import SelectUiLanguage from './SelectUiLanguage';

export const SettingsNotJoinedPortrait = () => {
  const { t } = useTranslation();
  const { cammute, toggleCammute } = useMyStreamStore();
  const { audioMode, toggleAudioMode } = useSettingsStore();

  const handleToggleAudioMode = () => toggleAudioMode();
  const handleCammute = () => toggleCammute();

  return (
    <View style={styles.container}>
      <PageHeader page={t('settings.page')} />
      <AccountSettings />
      <SelectUiLanguage />
      <View style={baseStyles.full}>
        <MyVideo styles={{ aspectRatio: 9 / 16, height: '100%' }} />
      </View>
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
      <DebugMode />
      <View style={styles.divider}></View>
      <RoomSelect />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 5,
    flex: 1,
    backgroundColor: 'black',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
});
