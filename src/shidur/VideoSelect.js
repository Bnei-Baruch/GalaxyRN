import ListInModal from '../components/ListInModal';
import React from 'react';
import { videos_options2 } from '../shared/consts';
import { useShidurStore } from '../zustand/shidur';
import { Text, View } from 'react-native';
import { baseStyles } from '../constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './AudioSelect';
import { useTranslation } from 'react-i18next';

const VideoSelect = () => {
  const { video, setVideo } = useShidurStore();
  const { t }               = useTranslation();

  const handleSetVideo = (item) => {
    console.log('handleSetVideo', item);
    setVideo(item.value);
  };

  const renderItem = (item) => {
    if (item.header) {
      return (
        <View style={[styles.container, styles.header]} key={item.key}>
          <Icon name={item.icon} color="white" size={30}></Icon>
          <Text style={[baseStyles.text, baseStyles.listItem]}>{t(item.description)}</Text>
        </View>
      );
    }

    return (
      <View style={styles.container} key={item.key}>
        <Text style={[baseStyles.text, baseStyles.listItem]}>{t(item.text)}</Text>
        <Text style={[baseStyles.text, baseStyles.listItem]}>{t(item.description)}</Text>
      </View>
    );
  };

  const selected = videos_options2.find(option => option.value === video);

  const trigger = (
    <View style={styles.container} key={selected.key}>
      <View style={styles.withArrow}>
        <Text style={[baseStyles.text, baseStyles.listItem]}>{t(selected.text)}</Text>
        <Text style={[baseStyles.text, baseStyles.listItem]}>({t(selected.description)})</Text>
      </View>
      <Icon name="keyboard-arrow-down" color="white" size={20}></Icon>
    </View>
  );
  return (
    <ListInModal
      items={videos_options2}
      selected={selected?.text}
      onSelect={handleSetVideo}
      renderItem={renderItem}
      trigger={trigger}
    />
  );
};

export default VideoSelect;