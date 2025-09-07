import { ACCOUNT_URL } from '@env';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ListInModal from '../components/ListInModal';
import TextDisplayWithButton from '../components/TextDisplayWithButton';
import { baseStyles } from '../constants';
import logger from '../services/logger';
import IconWithText from '../settings/IconWithText';
import { useUserStore } from '../zustand/user';
import RemoveUserModal from './RemoveUserModal';
import kc from './keycloak';

const NAMESPACE = 'AccountSettings';

const AccountSettings = ({ withTitle = true }) => {
  const { t } = useTranslation();
  const { user, removeMember } = useUserStore();
  const [removeUserModalVisible, setRemoveUserModalVisible] = useState(false);

  const handleRemoveMember = () => {
    logger.info(NAMESPACE, 'User deletion confirmed');
    removeMember();
  };

  const accauntOptions = [
    {
      key: 'account',
      value: 'account',
      text: t('user.account'),
      action: () => {
        try {
          Linking.openURL(ACCOUNT_URL);
        } catch (error) {
          logger.error(NAMESPACE, 'Error opening account page', error);
        }
      },
    },
    {
      key: 'logout',
      value: 'logout',
      text: t('user.logout'),
      action: () => kc.logout(),
    },
    {
      key: 'delete',
      value: 'delete',
      text: t('user.delete'),
      action: () => setRemoveUserModalVisible(true),
      style: {
        color: 'red',
      },
    },
  ];

  const handleSelect = item => item.action && item.action();

  const renderItem = item => (
    <Text style={[baseStyles.text, baseStyles.listItem, item?.style]}>
      {item.text}
    </Text>
  );

  return (
    <View style={styles.container}>
      <RemoveUserModal
        visible={removeUserModalVisible}
        onClose={() => setRemoveUserModalVisible(false)}
        onConfirm={handleRemoveMember}
      />
      {withTitle && (
        <IconWithText
          style={styles.title}
          iconName="account-circle"
          text={t('user.title')}
        />
      )}
      <TextDisplayWithButton
        label={t('user.name')}
        value={user?.display}
        button={
          <ListInModal
            items={accauntOptions}
            onSelect={handleSelect}
            renderItem={renderItem}
            trigger={<Icon name="arrow-drop-down" size={30} color="white" />}
          />
        }
      />
    </View>
  );
};

export default AccountSettings;

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dropdownContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.23)',
    color: 'rgba(255, 255, 255, 0.66)',
    padding: 10,
    borderRadius: 5,
    flex: 1,
  },
  disabled: {
    color: 'grey',
  },
  title: {
    marginBottom: 15,
  },
});
