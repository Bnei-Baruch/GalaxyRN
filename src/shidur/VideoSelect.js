import TooltipList, { styles } from '../components/TooltipList';
import React from 'react';
import { videos_options2 } from '../shared/consts';
import { useShidurStore } from '../zustand/shidur';
import { Text } from 'react-native';

const VideoSelect = () => {
  const { video, setVideo } = useShidurStore();

  const handleSetVideo = (item) => {
    console.log('handleSetVideo', item);
    setVideo(item.value);
  };

  const selected = videos_options2.find(option => option.value === video);

  const renderItem = (item) => <Text style={styles.itemText}>{item.description}</Text>;

  return (
    <TooltipList
      items={videos_options2}
      selected={selected?.text}
      onSelect={handleSetVideo}
      renderItem={renderItem}
      trigger={renderItem(selected)}
    />
  );
};

export default VideoSelect;