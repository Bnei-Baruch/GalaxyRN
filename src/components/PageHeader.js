import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { baseStyles } from '../constants';
import Text from './CustomText';

const PageHeader = ({ page }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, baseStyles.text]}>{t('pageTitle')}</Text>
      <Text style={[styles.page, baseStyles.text]}>{page}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    textAlign: 'center',
    textTransform: 'capitalize',
    width: '100%',
  },
  page: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    textTransform: 'capitalize',
    width: '100%',
  },
});

export default PageHeader;
