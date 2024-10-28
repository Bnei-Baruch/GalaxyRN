import * as React from 'react';
import { useShidurStore } from '../zustand/shidur';
import TooltipList from '../components/TooltipList';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Text } from 'react-native';
import AudioSelect from './AudioSelect';
import VideoSelect from './VideoSelect';

export const OptionsBtn = () => {
  const { ready } = useShidurStore();
  const items     = [
    { value: 'audio', text: 'Audio' },
    { value: 'video', text: 'Video' },
  ];
  console.log('OptionsBtn render', items);
  const handleSelect = () => {
  };
  const renderItem   = (item) => {
    console.log('renderItem', item);

    switch (item.value) {
      case 'audio':
        return (<>
          <AudioSelect />
        </>);
      case 'video':
        return (<>
          <VideoSelect />
        </>);
      default:
        return <Text>{item.text}</Text>;
    }
  };
  return (
    <TooltipList
      items={items}
      onSelect={handleSelect}
      renderItem={renderItem}
      trigger={<Icon name="settings" size={30} color="black" />}
    />
  );
};
