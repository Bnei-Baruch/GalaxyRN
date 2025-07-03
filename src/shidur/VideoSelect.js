import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import ListInModal from '../components/ListInModal';
import { baseStyles } from '../constants';
import logger from '../services/logger';
import { videos_options2 } from '../shared/consts';
import { useShidurStore } from '../zustand/shidur';

const NAMESPACE = 'VideoSelect';

const VideoSelect = () => {
  const { video, setVideo } = useShidurStore();
  const { t } = useTranslation();

  const handleSetVideo = item => {
    logger.debug(NAMESPACE, 'handleSetVideo', item);
    setVideo(item.value);
  };

  const renderItem = item => {
    if (item.header) {
      return (
        <View style={[styles.container, styles.header]} key={item.key}>
          <Icon name={item.icon} color="white" size={30}></Icon>
          <Text style={[baseStyles.text, baseStyles.listItem]}>
            {t(item.description)}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.container} key={item.key}>
        <Text style={[baseStyles.text, baseStyles.listItem]}>
          {t(item.text)}
        </Text>
        <Text style={[baseStyles.text, baseStyles.listItem]}>
          {t(item.description)}
        </Text>
      </View>
    );
  };

  const selected = videos_options2.find(option => option.value === video);

  const trigger = (
    <View style={styles.container} key={selected.key}>
      <View style={styles.withArrow}>
        <Text style={[baseStyles.text, baseStyles.listItem]}>
          {t(selected.text)}
        </Text>
        <Text style={[baseStyles.text, baseStyles.listItem]}>
          ({t(selected.description)})
        </Text>
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 5,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'white',
  },
  withArrow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
});

export default VideoSelect;
