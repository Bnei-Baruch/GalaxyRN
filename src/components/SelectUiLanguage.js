import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { baseStyles } from '../constants';
import TooltipList from './TooltipList';
import { setLanguage } from '../i18n/i18n';

const languagesOptions = [
  { key: 'en', value: 'en', text: 'English' },
  { key: 'es', value: 'es', text: 'Español' },
  { key: 'he', value: 'he', text: 'עברית' },
  { key: 'ru', value: 'ru', text: 'Русский' },
];
const SelectUiLanguage = () => {
  const [lang, setLang] = useState(languagesOptions[0].value);

  const handleLangChange = lang => {
    setLanguage(lang.value);
    setLang(lang.value);
  };
  const selected         = languagesOptions.find(option => option.value === lang);
  const renderItem       = (item) => <Text style={baseStyles.text}>{item.text}</Text>;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, baseStyles.text]}>Interface language</Text>

      <TooltipList
        items={languagesOptions}
        selected={selected?.text}
        onSelect={handleLangChange}
        renderItem={renderItem}
        trigger={<Text style={styles.selected}>{selected?.text}</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label    : {
    fontSize    : 16,
    marginBottom: 5,
  },
  selected : {
    borderWidth : 1,
    borderColor : 'rgba(255, 255, 255, 0.23)',
    borderRadius: 5,
    padding     : 10,
    color       : 'white',
  },
  item     : {
    backgroundColor: 'red',
  }
});

export default SelectUiLanguage;