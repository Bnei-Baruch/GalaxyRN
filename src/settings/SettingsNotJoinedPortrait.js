import * as React from 'react';
import SelectUiLanguage from './SelectUiLanguage';
import MyVideo from '../components/MyVideo';
import LabeledSwitch from './LabeledSwitch';
import { useSettingsStore } from '../zustand/settings';
import RoomSelect from './RoomSelect';
import { useMyStreamStore } from '../zustand/myStream';
import { View, StyleSheet } from 'react-native';
import PageHeader from '../components/PageHeader';
import { useTranslation } from 'react-i18next';
import { useShidurStore } from '../zustand/shidur';
import { baseStyles } from '../constants';
import AccountSettings from '../auth/AccountSettings';

export const SettingsNotJoinedPortrait = () => {
  const { t }                          = useTranslation();
  const { cammute, toggleCammute }     = useMyStreamStore();
  const { audioMode, toggleAudioMode } = useSettingsStore();
  const { setIsMuted, isMuted }        = useShidurStore();

  const handleToggleAudioMode = () => toggleAudioMode();
  const handleIsMuted         = () => setIsMuted();
  const handleCammute         = () => toggleCammute();

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

      <LabeledSwitch
        label={t('settings.isMuted')}
        value={isMuted}
        onValueChange={handleIsMuted}
      />
      <RoomSelect />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding        : 5,
    flex           : 1,
    backgroundColor: 'black',
  }
});
