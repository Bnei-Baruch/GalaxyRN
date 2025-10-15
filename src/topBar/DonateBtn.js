import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from '../components/CustomText';
import { topMenuBtns } from './helper';

const PARAMS =
  '"utm_source"=arvut_system&"&"utm_medium"="button"&"utm_campaign"="donations"&"utm_id"="donations"&"utm_content"="header_button_donate"&"utm_term"="heb"';

const iso2ByIso1 = {
  he: 'heb',
  en: 'eng',
  ru: 'rus',
  es: 'spa',
};

export const DonateBtn = () => {
  const { t, i18n } = useTranslation();

  const isHe = i18n.language === 'he';
  const handlePress = () => {
    const url = `https://www.kab1.com${
      isHe ? '' : '/' + i18n.language
    }?${PARAMS}&"utm_term"=${iso2ByIso1[i18n.language]}`;
    Linking.openURL(url);
  };
  return (
    <TouchableOpacity onPress={handlePress} style={topMenuBtns.btn}>
      <Icon name="favorite" size={30} color="white" />
      <Text style={topMenuBtns.menuItemText}>{t('topBar.donate')}</Text>
    </TouchableOpacity>
  );
};
