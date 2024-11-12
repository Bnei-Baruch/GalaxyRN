import ListInModal from '../components/ListInModal';
import React from 'react';
import { videos_options2 } from '../shared/consts';
import { useShidurStore } from '../zustand/shidur';
import { Text } from 'react-native';
import { baseStyles } from '../constants';

const VideoSelect = () => {
  const { video, setVideo } = useShidurStore();

  const handleSetVideo = (item) => {
    console.log('handleSetVideo', item);
    setVideo(item.value);
  };

  const selected = videos_options2.find(option => option.value === video);

  const renderItem = (item) => <Text style={[baseStyles.text, baseStyles.listItem]}>{item.description}</Text>;

  return (
    <ListInModal
      items={videos_options2}
      selected={selected?.text}
      onSelect={handleSetVideo}
      renderItem={renderItem}
      trigger={renderItem(selected)}
    />
  );
};

export default VideoSelect;