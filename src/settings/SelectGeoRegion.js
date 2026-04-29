import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Text from '../components/CustomText';
import ListInModal from '../components/ListInModal';
import TextDisplayWithButton from '../components/TextDisplayWithButton';
import { baseStyles } from '../constants';
import { GEO_REGION_AUTO, GEO_REGION_RU } from '../consts';
import { useSettingsStore } from '../zustand/settings';

const geoRegionOptions = [
  { key: GEO_REGION_AUTO, value: GEO_REGION_AUTO, text: 'Auto' },
  { key: GEO_REGION_RU, value: GEO_REGION_RU, text: 'Russia' },
];

const SelectGeoRegion = () => {
  const { t } = useTranslation();
  const { geoRegion, setGeoRegion } = useSettingsStore();

  const selected = geoRegionOptions.find(option => option.value === geoRegion);

  const handleRegionChange = option => setGeoRegion(option.value);
  const renderItem = item => (
    <Text style={[baseStyles.text, baseStyles.listItem]}>{item.text}</Text>
  );

  return (
    <View style={styles.container}>
      <TextDisplayWithButton label={t('settings.geoRegion')}>
        <ListInModal
          items={geoRegionOptions}
          selected={selected?.text}
          onSelect={handleRegionChange}
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

export default SelectGeoRegion;
