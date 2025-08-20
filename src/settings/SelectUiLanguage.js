import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
      <TextDisplayWithButton
        label={t('settings.uiLanguage')}
        value={selected?.text}
        button={
          <ListInModal
            items={languagesOptions}
            selected={selected?.text}
            onSelect={handleLangChange}
            renderItem={renderItem}
            trigger={<Icon name="arrow-drop-down" size={30} color="white" />}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    flex: 1,
  },
  selected: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.23)',
    borderRadius: 5,
    padding: 10,
  },
});

export default SelectUiLanguage;
