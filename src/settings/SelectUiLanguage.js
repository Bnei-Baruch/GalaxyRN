import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Text from '../components/CustomText';
import ListInModal from '../components/ListInModal';
import TextDisplayWithButton from '../components/TextDisplayWithButton';
import { baseStyles } from '../constants';
import { setLanguage } from '../i18n/i18n';

const languagesOptions = [
  { key: 'en', value: 'en', text: 'English' },
  { key: 'es', value: 'es', text: 'Español' },
  { key: 'he', value: 'he', text: 'עברית' },
  { key: 'ru', value: 'ru', text: 'Русский' },
];
const SelectUiLanguage = () => {
  const { t, i18n } = useTranslation();

  const selected = languagesOptions.find(
    option => option.value === i18n.language
  );

  const handleLangChange = lang => setLanguage(lang.value);
  const renderItem = item => (
    <Text style={[baseStyles.text, baseStyles.listItem]}>{item.text}</Text>
  );

  return (
    <View style={styles.container}>
      <TextDisplayWithButton label={t('settings.uiLanguage')}>
        <ListInModal
          items={languagesOptions}
          selected={selected?.text}
          onSelect={handleLangChange}
          renderItem={renderItem}
          trigger={
            <View style={styles.triggerContainer}>
              <View style={styles.triggerTextContainer}>
                <Text style={styles.triggerText}>{selected?.text}</Text>
              </View>
              <Icon
                name="arrow-drop-down"
                size={30}
                color="white"
                style={styles.triggerIcon}
              />
            </View>
          }
        />
      </TextDisplayWithButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  selected: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.23)',
    borderRadius: 5,
    padding: 10,
  },
  triggerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  triggerTextContainer: {
    justifyContent: 'center',
    paddingVertical: 8,
    flex: 1,
    paddingHorizontal: 10,
  },
  triggerText: {
    fontSize: 16,
    color: 'white',
  },
  triggerIcon: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SelectUiLanguage;
