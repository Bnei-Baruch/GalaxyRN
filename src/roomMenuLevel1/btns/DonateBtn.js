import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable } from 'react-native';
import BottomBarIconWithText from '../../settings/BottomBarIconWithText';
import { bottomBar } from '../../roomMenuLevel0/helper';
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
    <Pressable onPress={handlePress} style={bottomBar.btn}>
      <BottomBarIconWithText
        iconName="favorite"
        text={t('moreOpts.donate')}
        extraStyle={['rest', 'resticon']}
        showtext={[ true, false ]}
        direction={['horizontal', 'horizontal']}
      />
    </Pressable>
  );
};
