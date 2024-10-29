import * as React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSettingsStore } from '../zustand/settings';
import { styles } from '../components/TooltipList';
import { baseStyles } from '../constants';

export const LeaveBtn = () => {
  const { setReadyForJoin } = useSettingsStore();

  const handlePress = () => setReadyForJoin(false);

  return (
    <TouchableOpacity onPress={handlePress}>
      <Icon name="arrow-forward" size={30} />
      <Text style={[styles.itemText, baseStyles.text]}> Leave Room </Text>
    </TouchableOpacity>
  );
};
