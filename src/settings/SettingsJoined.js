import { View, StyleSheet, Button } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMyStreamStore } from '../zustand/myStream';
import { useSettingsStore } from '../zustand/settings';
import { useUserStore } from '../zustand/user';
import PageHeader from '../components/PageHeader';
import IconWithText from './IconWithText';
import LabeledInput from './LabeledInput';
import SelectUiLanguage from './SelectUiLanguage';
import LabeledSwitch from './LabeledSwitch';
import * as React from 'react';
import { baseStyles } from '../constants';
import { useShidurStore } from '../zustand/shidur';

export const SettingsJoined = ({ toggleVisible }) => {
  const { t }                                    = useTranslation();
  const { cammute, toggleCammute }               = useMyStreamStore();
  const { isShidur, audioMode, toggleAudioMode } = useSettingsStore();
  const { user }                                 = useUserStore();
  const { setIsMuted }                           = useShidurStore();

  const handleToggleAudioMode = () => toggleAudioMode();
  const handleIsMuted         = () => setIsMuted();
  const handleCammute         = () => toggleCammute();

  return (
    <View style={styles.container}>
      <PageHeader page={t('settings.page')} />
      <View style={[styles.container, !isPortrait && styles.landscape]}>
        <View style={styles.row}>
          {/*user settings*/}
          <IconWithText iconName="account-circle" text="user settings" />
          <LabeledInput label="Screen Name" value={user.display} disabled={true} />
          <SelectUiLanguage />
        </View>
        <View style={styles.row}>
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
            onValueChange={handleIsMuted}
          />
          <View style={baseStyles.full} />
          <View style={styles.containerBack}>
            <Button
              title={t('settings.backToTen')}
              onPress={toggleVisible}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container    : {
    padding        : 5,
    flex           : 1,
    backgroundColor: 'black',
  },
  row          : {
    flex: 1,
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