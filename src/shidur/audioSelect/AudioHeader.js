import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { baseStyles } from '../../constants';

const AudioHeader = ({ icon, text, description }) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, styles.header]}>
      <Icon name={icon} color="white" size={30} />
      <Text style={[baseStyles.text, baseStyles.listItem]}>{t(text)}</Text>
      <Text style={[baseStyles.text, styles.description]}>
        {t(description)}
      </Text>
    </View>
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
    paddingBottom: 10,
    marginBottom: 10,
  },
  description: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 10,
  },
});

export default AudioHeader;
