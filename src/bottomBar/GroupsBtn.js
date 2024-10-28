import * as React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from '../components/TooltipList';
import { useSettingsStore } from '../zustand/settings';

export const GroupsBtn = () => {
  const { showGroups, toggleShowGroups } = useSettingsStore();

  const handlePress = () => toggleShowGroups();

  return (
    <TouchableOpacity onPress={handlePress}>
      <Icon name="public" size={30} />
      <Text style={[styles.itemText, showGroups && styles.selected]}> Groups </Text>
    </TouchableOpacity>
  );
};
