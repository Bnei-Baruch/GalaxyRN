import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Text from '../components/CustomText';
import { baseStyles } from '../constants';
import { bottomBar } from '../roomMenuLevel0/helper';
import { buttonsPaneStyles } from '../roomMenuLevel1/helper';
import { useInitsStore } from '../zustand/inits';
import { useMyStreamStore } from '../zustand/myStream';
import { useSettingsStore } from '../zustand/settings';
import BottomBarIconWithText from './BottomBarIconWithText';

type EntryMode = 'all' | 'ten' | 'broadcast';

const MODES: { mode: EntryMode; testID: string }[] = [
  { mode: 'all', testID: 'entryModeAll' },
  { mode: 'ten', testID: 'entryModeTen' },
  { mode: 'broadcast', testID: 'entryModeBroadcast' },
];

type ModeOptionProps = {
  testID: string;
  title: string;
  description?: string;
  selected: boolean;
  compact: boolean;
  onPress: () => void;
};

const ModeOption = ({
  testID,
  title,
  description,
  selected,
  compact,
  onPress,
}: ModeOptionProps) => (
  <Pressable
    testID={testID}
    accessibilityLabel={testID}
    accessibilityRole="radio"
    accessibilityState={{ checked: selected, selected }}
    onPress={onPress}
    style={[
      styles.option,
      compact && styles.optionCompact,
      selected && styles.optionSelected,
    ]}
  >
    {!compact && (
      <Icon
        name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
        size={20}
        color={selected ? SELECTED_FG : '#ddd'}
        style={styles.optionIcon}
      />
    )}
    <View style={styles.optionTexts}>
      <Text
        style={[
          styles.optionTitle,
          compact && styles.optionTitleCompact,
          selected && styles.optionTextSelected,
        ]}
        numberOfLines={compact ? 2 : 1}
      >
        {title}
      </Text>
      {!!description && (
        <Text
          style={[styles.optionDesc, selected && styles.optionTextSelected]}
          numberOfLines={2}
        >
          {description}
        </Text>
      )}
    </View>
  </Pressable>
);

type TileProps = {
  testID: string;
  iconName: string;
  text: string;
  on: boolean;
  wide: boolean;
  onPress: () => void;
};

const Tile = ({ testID, iconName, text, on, wide, onPress }: TileProps) => (
  <View
    style={wide ? buttonsPaneStyles.button_100 : buttonsPaneStyles.button_50}
  >
    <Pressable
      testID={testID}
      accessibilityLabel={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={bottomBar.btn}
    >
      <BottomBarIconWithText
        iconName={iconName}
        text={text}
        extraStyle={
          on
            ? ['toggle_on', 'toggle_on_icon']
            : ['toggle_off', 'toggle_off_icon']
        }
        showtext={true}
        direction={['horizontal', 'horizontal']}
      />
    </Pressable>
  </View>
);

/**
 * "How to join" on the before-room screen: a single choice between ten +
 * broadcast, ten only and broadcast only, each with a one-line explanation.
 * Portrait lists the modes with their descriptions; landscape (short on
 * height) puts them in one row and describes only the selected one.
 * The camera tile is shown only when a ten is joined.
 */
const EntryOptions = () => {
  const { t } = useTranslation();
  const isPortrait = useInitsStore(state => state.isPortrait);
  const { cammute, toggleCammute } = useMyStreamStore();
  const { isShidur, isTen, audioMode, setEntryMode, toggleAudioMode } =
    useSettingsStore();

  const current: EntryMode = !isTen ? 'broadcast' : isShidur ? 'all' : 'ten';

  return (
    <View style={[styles.panel, baseStyles.panelBackground]}>
      <Text style={[baseStyles.text, buttonsPaneStyles.text]} numberOfLines={1}>
        {t('settings.entryMode.title')}
      </Text>
      <View
        accessibilityRole="radiogroup"
        style={[styles.options, !isPortrait && styles.optionsRow]}
      >
        {MODES.map(({ mode, testID }) => (
          <ModeOption
            key={mode}
            testID={testID}
            title={t(`settings.entryMode.${mode}`)}
            description={
              isPortrait ? t(`settings.entryMode.${mode}Desc`) : undefined
            }
            selected={mode === current}
            compact={!isPortrait}
            onPress={() => setEntryMode(mode)}
          />
        ))}
      </View>
      {!isPortrait && (
        <Text style={[styles.optionDesc, styles.currentDesc]} numberOfLines={1}>
          {t(`settings.entryMode.${current}Desc`)}
        </Text>
      )}
      <View style={buttonsPaneStyles.buttonsRow}>
        {isTen && (
          <Tile
            testID="entryCammuteBtn"
            iconName={cammute ? 'videocam-off' : 'videocam'}
            text={t('settings.cammute')}
            on={cammute}
            wide={false}
            onPress={() => toggleCammute()}
          />
        )}
        <Tile
          testID="entryAudioModeBtn"
          iconName="hearing"
          text={t('settings.audioMode')}
          on={audioMode}
          wide={!isTen}
          onPress={() => toggleAudioMode()}
        />
      </View>
    </View>
  );
};

const SELECTED_BG = '#5FD2FF';
const SELECTED_FG = '#003458';

const styles = StyleSheet.create({
  panel: {
    borderRadius: 24,
    padding: 12,
    marginVertical: 8,
  },
  options: {
    marginTop: 8,
    gap: 6,
  },
  optionsRow: {
    flexDirection: 'row',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  optionCompact: {
    flex: 1,
    paddingHorizontal: 8,
  },
  optionSelected: {
    backgroundColor: SELECTED_BG,
  },
  optionIcon: {
    marginRight: 10,
  },
  optionTexts: {
    flex: 1,
  },
  optionTitle: {
    color: '#ddd',
    fontSize: 14,
    fontWeight: '600',
  },
  optionTitleCompact: {
    textAlign: 'center',
  },
  optionDesc: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 1,
  },
  optionTextSelected: {
    color: SELECTED_FG,
  },
  currentDesc: {
    marginTop: 6,
    marginLeft: 8,
  },
});

export default EntryOptions;
