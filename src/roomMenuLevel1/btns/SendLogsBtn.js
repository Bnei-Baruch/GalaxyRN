import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from '../components/CustomText';
import { baseStyles } from '../constants';
import SendLogsBridge from '../services/SendLogsBridge';
import { useUserStore } from '../zustand/user';

const SendLogsBtn = () => {
  const email = useUserStore(state => state.user?.email);
  const { t } = useTranslation();
  const handlePress = () => {
    SendLogsBridge.sendLogs(email);
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.container}>
        <Icon name="send" size={30} color="white" />
        <Text style={[baseStyles.text, styles.text]}>
          {t('topBar.sendLogs')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    ...baseStyles.listItem,
    flexDirection: 'row',
    alignItems: 'start',
    justifyContent: 'start',
  },
  text: {
    marginHorizontal: 10,
  },
});

export default SendLogsBtn;
