import TooltipList, { styles } from '../components/TooltipList';
import React from 'react';
import { audiog_options2 } from '../shared/consts';
import { useShidurStore } from '../zustand/shidur';

import { Text } from 'react-native';

const AudioSelect = () => {
  const { audio, setAudio } = useShidurStore();

  const handleSetAudio = (item) => {
    console.log('handleSetAudio', item);
    setAudio(item.value, item.eng_text);
  };

  const selected   = audiog_options2.find(option => option.value === audio);
  const renderItem = (item) => <Text style={styles.itemText}>{item.text}</Text>;

  return (
    <TooltipList
      items={audiog_options2}
      selected={selected?.text}
      onSelect={handleSetAudio}
      renderItem={renderItem}
      trigger={renderItem(selected)}
    />
  );
};

export default AudioSelect;