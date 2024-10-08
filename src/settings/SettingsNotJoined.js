import * as React from 'react';
import { useState } from 'react';
import IconWithText from '../components/IconWithText';
import LabeledInput from '../components/LabeledInput';
import LabeledSelect from '../components/LabeledSelect';
import MyVideo from '../components/MyVideo';
import LabeledSwitch from '../components/LabeledSwitch';
import { useSettingsStore } from '../zustand/settings';
import RoomSelect from './RoomSelect';
import { useMyStreamStore } from '../zustand/myStream';

export const languagesOptions = [
  { key: 'en', value: 'en', text: 'English' },
  { key: 'es', value: 'es', text: 'Español' },
  { key: 'he', value: 'he', text: 'עברית' },
  { key: 'ru', value: 'ru', text: 'Русский' },
];

export const SettingsNotJoined = () => {
  const [lang, setLang] = useState(languagesOptions[0].value);

  const { cammute, toggleCammute }                            = useMyStreamStore();
  const { isBroadcast, toggleIsBroadcast, isTen, toggleIsTen } = useSettingsStore();

  const handleToggleIsTen       = () => toggleIsTen();
  const handleToggleIsBroadcast = () => toggleIsBroadcast();
  const handleLangChange        = lang => setLang(lang);
  const handleCammute           = () => toggleCammute();

  return (
    <>
      {/*user settings*/}
      <IconWithText iconName="account-circle" text="user settings" />
      <LabeledInput />
      <LabeledSelect
        label="Country"
        options={languagesOptions}
        selectedValue={lang}
        onValueChange={handleLangChange}
      />
      {/*Audio mode*/}
      <IconWithText iconName="account-circle" text="Audio mode" />
      <MyVideo />
      <LabeledSwitch
        label={'Stop video'}
        initialValue={cammute}
        onValueChange={handleCammute}
      />
      <LabeledSwitch
        label={'Ten (Recommended)'}
        initialValue={isTen}
        onValueChange={handleToggleIsTen}
      />

      <LabeledSwitch
        label={'Broadcast'}
        initialValue={isBroadcast}
        onValueChange={handleToggleIsBroadcast}
      />
      <RoomSelect />
    </>
  );
};
