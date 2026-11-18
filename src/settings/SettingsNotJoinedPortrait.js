import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AccountSettings from '../auth/AccountSettings';
import MyVideo from '../components/MyVideo';
import PageHeader from '../components/PageHeader';
import VersionInfo from '../components/VersionInfo';
import { baseStyles } from '../constants';
import { useSettingsStore } from '../zustand/settings';
import EntryOptions from './EntryOptions';
import RoomSelect from './RoomSelect';
import SelectUiLanguage from './SelectUiLanguage';

export const SettingsNotJoinedPortrait = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isTen = useSettingsStore(state => state.isTen);

  return (
    <View
      style={[
        styles.container,
        baseStyles.viewBackground,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <PageHeader page={t('settings.page')} />
      <AccountSettings />
      <View style={styles.width100}>
        <SelectUiLanguage />
      </View>
      <View style={styles.width100}>
        <VersionInfo />
      </View>
      <View style={baseStyles.full}>
        <MyVideo styles={isTen ? styles.myVideo : styles.myVideoNoTen} />
      </View>
      <EntryOptions />
      <View style={styles.divider}></View>
      <RoomSelect />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  width100: {
    width: '100%',
  },
  myVideo: {
    aspectRatio: 9 / 16,
    height: '100%',
  },
  myVideoNoTen: {
    width: '100%',
    height: '100%',
  },
});
