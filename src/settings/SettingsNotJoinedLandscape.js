import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import AccountSettings from '../auth/AccountSettings';
import MyVideo from '../components/MyVideo';
import PageHeader from '../components/PageHeader';
import { baseStyles } from '../constants';
import { useMyStreamStore } from '../zustand/myStream';
import { useSettingsStore } from '../zustand/settings';
import LabeledSwitch from './LabeledSwitch';
import RoomSelect from './RoomSelect';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VersionInfo from '../components/VersionInfo';
import SelectUiLanguage from './SelectUiLanguage';

export const SettingsNotJoinedLandscape = () => {
  const { t } = useTranslation();
  const { cammute, toggleCammute } = useMyStreamStore();
  const { audioMode, toggleAudioMode } = useSettingsStore();

  const handleToggleAudioMode = () => toggleAudioMode();
  const handleCammute = () => toggleCammute();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        baseStyles.viewBackground,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <PageHeader page={t('settings.page')} />
      {/*user settings*/}
      <View style={[styles.forms, { paddingBottom: insets.bottom + 16 }]}>
        <View style={{ width: '43%', justifyContent: 'space-between' }}>
          <MyVideo
            styles={{ aspectRatio: 16 / 9, width: '100%', alignSelf: 'center' }}
          />
          <VersionInfo />
        </View>
        <View style={{ width: '50%' }}>
          <AccountSettings />
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
          <View style={baseStyles.full} />
          <RoomSelect />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  forms: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
});
