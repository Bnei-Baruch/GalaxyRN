import { View, StyleSheet, Button } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMyStreamStore } from '../zustand/myStream';
import { useSettingsStore } from '../zustand/settings';
import { useInitsStore } from '../zustand/inits';
import { useUserStore } from '../zustand/user';
import PageHeader from '../components/PageHeader';
import IconWithText from './IconWithText';
import LabeledInput from './LabeledInput';
import SelectUiLanguage from './SelectUiLanguage';
import LabeledSwitch from './LabeledSwitch';
import * as React from 'react';
import { baseStyles } from '../constants';

export const SettingsJoined = ({ toggleVisible }) => {
  const { t }                                                    = useTranslation();
  const { cammute, toggleCammute }                               = useMyStreamStore();
  const { isShidur, toggleIsShidur, audioMode, toggleAudioMode } = useSettingsStore();
  const { isPortrait }                                           = useInitsStore();
  const { user }                                                 = useUserStore();

  const handleToggleAudioMode = () => toggleAudioMode();
  const handleToggleIsShidur  = () => toggleIsShidur();
  const handleCammute         = () => toggleCammute();

  return (
    <View style={styles.container}>
      <PageHeader page={t('settings.page')} />
      {/*user settings*/}
      <IconWithText iconName="account-circle" text="user settings" />
      <LabeledInput label="Screen Name" value={user.display} disabled={true} />
      <SelectUiLanguage />
      <LabeledSwitch
        label={'Stop video'}
        value={cammute}
        onValueChange={handleCammute}
      />
      <LabeledSwitch
        label={'Audio Mode'}
        value={audioMode}
        onValueChange={handleToggleAudioMode}
      />
      <LabeledSwitch
        label={'Mute Broadcast'}
        value={isShidur}
        onValueChange={handleToggleIsShidur}
      />
      <View style={baseStyles.full} />
      <View style={styles.containerBack}>
        <Button
          title={t('settings.backToTen')}
          onPress={toggleVisible}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container    : {
    padding        : 3,
    flex           : 1,
    backgroundColor: 'black',
  },
  landscape    : {
    flexDirection: 'row',
    flexWrap     : 'wrap',
  },
  containerBack: {
    alignItems: 'flex-end',
    padding   : 10,
  }
});