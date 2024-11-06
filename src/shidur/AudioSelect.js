import React from 'react';
import { Text } from 'react-native';

import ListInModal from '../components/ListInModal';
import { audiog_options2 } from '../shared/consts';
import { useShidurStore } from '../zustand/shidur';
import { baseStyles } from '../constants';

const AudioSelect = () => {
  const { audio, setAudio } = useShidurStore();

  const handleSetAudio = (item) => {
    console.log('handleSetAudio', item);
    setAudio(item.value, item.eng_text);
  };

  const selected   = audiog_options2.find(option => option.value === audio);
  const renderItem = (item) => <Text style={baseStyles.text}>{item.text}</Text>;

  return (
    <ListInModal
      items={audiog_options2}
      selected={selected?.text}
      onSelect={handleSetAudio}
      renderItem={renderItem}
      trigger={renderItem(selected)}
    />
  );
};

export default AudioSelect;