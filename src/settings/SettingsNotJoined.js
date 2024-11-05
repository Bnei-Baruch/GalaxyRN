import * as React from 'react';
import IconWithText from '../components/IconWithText';
import LabeledInput from '../components/LabeledInput';
import SelectUiLanguage from '../components/SelectUiLanguage';
import MyVideo from '../components/MyVideo';
import LabeledSwitch from '../components/LabeledSwitch';
import { useSettingsStore } from '../zustand/settings';
import RoomSelect from './RoomSelect';
import { useMyStreamStore } from '../zustand/myStream';
import { View, StyleSheet } from 'react-native';
import { useInitsStore } from '../zustand/inits';
import PageHeader from '../components/PageHeader';
import { useUserStore } from '../zustand/user';

export const SettingsNotJoined = () => {

  const { cammute, toggleCammute }                                     = useMyStreamStore();
  const { isBroadcast, toggleIsBroadcast, audioMode, toggleAudioMode } = useSettingsStore();
  const { isPortrait }                                                 = useInitsStore();
  const { user }                                                       = useUserStore();

  const handleToggleAudioMode   = () => toggleAudioMode();
  const handleToggleIsBroadcast = () => toggleIsBroadcast();
  const handleCammute           = () => toggleCammute();

  return (
    <View style={styles.container}>
      <PageHeader page="Settings" />
      {/*user settings*/}
      <IconWithText iconName="account-circle" text="user settings" />
      <LabeledInput label="Screen Name" value={user.display} disabled={true} />
      <SelectUiLanguage />
      <MyVideo isPortrait={false} />
      <LabeledSwitch
        label={'Stop video'}
        initialValue={cammute}
        onValueChange={handleCammute}
      />
      <LabeledSwitch
        label={'Audio Mode'}
        initialValue={audioMode}
        onValueChange={handleToggleAudioMode}
      />

      <LabeledSwitch
        label={'Mute Broadcast'}
        initialValue={isBroadcast}
        onValueChange={handleToggleIsBroadcast}
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
