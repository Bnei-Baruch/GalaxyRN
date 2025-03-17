import * as React from 'react';
import { TouchableOpacity, Text, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { topMenuBtns } from './helper';
import { useSettingsStore } from '../zustand/settings';
import { useTranslation } from 'react-i18next';

const PARAMS = '"utm_source"=arvut_system&"&"utm_medium"="button"&"utm_campaign"="donations"&"utm_id"="donations"&"utm_content"="header_button_donate"&"utm_term"="heb"';

const iso2ByIso1 = {
  he: 'heb',
  en: 'eng',
  ru: 'rus',
  es: 'spa',
};

export const DonateBtn = () => {
  const { uiLang } = useSettingsStore();
  const { t }      = useTranslation();

  const isHe        = uiLang === 'he';
  const handlePress = () => {
    params.set('utm_term', iso2ByIso1[uiLang]);
    Linking.openURL(`https://www.kab1.com${isHe ? '' : '/' + uiLang}?${PARAMS}`);
  };
  return (
    <TouchableOpacity onPress={handlePress} style={topMenuBtns.btn}>
      <Icon name="favorite" size={30} color="white" />
      <Text style={topMenuBtns.menuItemText}>
        {t('topBar.donate')}
      </Text>
    </TouchableOpacity>
  );
};
