import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import Text from '../components/CustomText';
import { baseStyles } from '../constants';
import { bottomBar } from '../roomMenuLevel0/helper';
import { buttonsPaneStyles } from '../roomMenuLevel1/helper';
import { useMyStreamStore } from '../zustand/myStream';
import { useSettingsStore } from '../zustand/settings';
import BottomBarIconWithText from './BottomBarIconWithText';

type TileVariant = 'blue' | 'pink' | 'off' | 'disabled';

const VARIANT_STYLES: Record<TileVariant, [string, string]> = {
  blue: ['toggle_on_alt2', 'toggle_on_icon_alt2'],
  pink: ['toggle_on', 'toggle_on_icon'],
  off: ['toggle_off', 'toggle_off_icon'],
  disabled: ['toggle_off_disabled', 'toggle_off_disabled_icon'],
};

type TileProps = {
  testID: string;
  iconName: string;
  text: string;
  variant: TileVariant;
  disabled?: boolean;
  onPress: () => void;
};

const Tile = ({
  testID,
  iconName,
  text,
  variant,
  disabled,
  onPress,
}: TileProps) => (
  <View style={buttonsPaneStyles.button_50}>
    <Pressable
      testID={testID}
      accessibilityLabel={testID}
      accessibilityRole="switch"
      accessibilityState={{
        checked: variant === 'blue' || variant === 'pink',
        disabled: !!disabled,
      }}
      onPress={onPress}
      disabled={disabled}
      style={bottomBar.btn}
    >
      <BottomBarIconWithText
        iconName={iconName}
        text={text}
        extraStyle={VARIANT_STYLES[variant]}
        showtext={true}
        direction={['vertical', 'horizontal']}
      />
    </Pressable>
  </View>
);

/**
 * Room entry presets on the before-room screen, styled like the in-room
 * menu. Broadcast / Ten choose what to join (at least one stays on);
 * the camera only matters when joining the ten.
 */
const EntryOptions = () => {
  const { t } = useTranslation();
  const { cammute, toggleCammute } = useMyStreamStore();
  const {
    isShidur,
    isTen,
    audioMode,
    toggleIsShidur,
    toggleIsTen,
    toggleAudioMode,
  } = useSettingsStore();

  const onVariant = (on: boolean, color: TileVariant): TileVariant =>
    on ? color : 'off';

  return (
    <View style={[styles.panel, baseStyles.panelBackground]}>
      <View style={buttonsPaneStyles.buttonsSection}>
        <Text
          style={[baseStyles.text, buttonsPaneStyles.text]}
          numberOfLines={1}
        >
          {t('bottomBar.show')}
        </Text>
        <View style={buttonsPaneStyles.buttonsRow}>
          <Tile
            testID="entryShidurBtn"
            iconName="desktop-windows"
            text={t('bottomBar.shidur')}
            variant={onVariant(isShidur, 'blue')}
            disabled={isShidur && !isTen}
            onPress={() => toggleIsShidur()}
          />
          <Tile
            testID="entryTenBtn"
            iconName="groups"
            text={t('bottomBar.ten')}
            variant={onVariant(isTen, 'blue')}
            disabled={isTen && !isShidur}
            onPress={() => toggleIsTen()}
          />
        </View>
      </View>
      <View
        style={[
          buttonsPaneStyles.buttonsSection,
          buttonsPaneStyles.buttonsSectionLast,
        ]}
      >
        <View style={buttonsPaneStyles.buttonsRow}>
          <Tile
            testID="entryCammuteBtn"
            iconName={cammute ? 'videocam-off' : 'videocam'}
            text={t('settings.cammute')}
            variant={isTen ? onVariant(cammute, 'pink') : 'disabled'}
            disabled={!isTen}
            onPress={() => toggleCammute()}
          />
          <Tile
            testID="entryAudioModeBtn"
            iconName="hearing"
            text={t('settings.audioMode')}
            variant={onVariant(audioMode, 'pink')}
            onPress={() => toggleAudioMode()}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    borderRadius: 32,
    padding: 16,
    marginVertical: 8,
  },
});

export default EntryOptions;
