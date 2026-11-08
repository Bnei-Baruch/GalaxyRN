import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import AccountSettings from '../auth/AccountSettings';
import MyVideo from '../components/MyVideo';
import PageHeader from '../components/PageHeader';
import { baseStyles } from '../constants';
import EntryOptions from './EntryOptions';
import RoomSelect from './RoomSelect';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VersionInfo from '../components/VersionInfo';
import SelectUiLanguage from './SelectUiLanguage';

export const SettingsNotJoinedLandscape = () => {
  const { t } = useTranslation();
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
          <EntryOptions />
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
