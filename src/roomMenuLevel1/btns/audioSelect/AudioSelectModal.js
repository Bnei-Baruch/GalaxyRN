import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from '../../../components/CustomText';
import {
  dualLanguageOptions,
  sourceStreamOptions,
  workShopOptions,
} from '../../../consts';
import logger from '../../../services/logger';
import { useShidurStore } from '../../../zustand/shidur';
import AudioOption from './AudioOption';

const NAMESPACE = 'AudioSelectModal';

const ORIGINAL_KEY = 'wo_original';

// Mode = the key prefix. The same language exists in several modes, so the
// modal shows one mode at a time and switching mode keeps the language.
const MODES = [
  {
    mode: 'wo',
    icon: 'group',
    label: 'shidur.streamForWorkshopDescription',
    options: workShopOptions,
  },
  {
    mode: 'ss',
    icon: 'center-focus-strong',
    label: 'shidur.sourceStreamDescription',
    options: sourceStreamOptions,
  },
  {
    mode: 'dl',
    icon: 'translate',
    label: 'shidur.dualLnaguagesStream',
    options: dualLanguageOptions,
  },
];

const modeOf = key => key.split('_')[0];

// 'wo_ru' -> 'ru', 'dl_he_ru' -> 'ru' (the non-Hebrew side of a dual stream).
const langOf = key => {
  const parts = key.split('_');
  return parts[parts.length - 1];
};

const findInMode = (mode, lang) =>
  MODES.find(m => m.mode === mode).options.find(o => langOf(o.key) === lang);

// Rendered by each AudioSelectBtn (not once in Room) so it is presented from
// whatever is on top: inside MenuLevel1's Modal it stacks over the menu. On iOS
// a sibling Modal can't present while another one is shown — it silently
// fails and leaves an invisible window swallowing touches.
const AudioSelectModal = ({ visible, onClose }) => {
  const { t, i18n } = useTranslation();
  const audio = useShidurStore(state => state.audio);
  const setAudio = useShidurStore(state => state.setAudio);

  const currentMode = audio ? modeOf(audio.key) : 'wo';
  const [tab, setTab] = useState(currentMode);

  // Every open starts on the mode that is actually playing.
  useEffect(() => {
    if (visible) {
      setTab(currentMode);
    }
  }, [visible, currentMode]);

  const { pinned, rest } = useMemo(() => {
    if (!audio) {
      return { pinned: [], rest: [] };
    }
    const options = MODES.find(m => m.mode === tab).options;
    // Original is a workshop-mode stream only — no ss/dl counterpart.
    const original = options.find(o => o.key === ORIGINAL_KEY);
    const _pinned = original ? [original] : [];
    [langOf(audio.key), i18n.language].forEach(lang => {
      const opt = options.find(o => langOf(o.key) === lang);
      if (opt && !_pinned.includes(opt)) {
        _pinned.push(opt);
      }
    });
    return {
      pinned: _pinned,
      rest: options.filter(o => !_pinned.includes(o)),
    };
  }, [tab, audio, i18n.language]);

  // Selecting a stream (or switching mode) keeps the modal open — only the
  // close button / back dismisses it.
  const handleSetAudio = key => {
    logger.debug(NAMESPACE, 'handleSetAudio', key);
    if (key !== audio?.key) {
      setAudio(key);
    }
  };

  // Switch mode keeping the language. If this language has no stream in the
  // target mode, just show that mode's list and let the user pick.
  const handleSelectMode = mode => {
    logger.debug(NAMESPACE, 'handleSelectMode', mode);
    setTab(mode);
    if (mode === currentMode) {
      return;
    }
    const target = findInMode(mode, langOf(audio.key));
    if (target) {
      handleSetAudio(target.key);
    }
  };

  const handleClose = () => {
    logger.debug(NAMESPACE, 'handleClose');
    onClose();
  };

  if (!audio) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      presentationStyle="overFullScreen"
      visible={visible}
      onRequestClose={handleClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.container}>
        <View
          testID="audioSelectModal"
          style={styles.modalContent}
          pointerEvents="auto"
        >
          <View style={styles.headerRow}>
            <View style={styles.tabs}>
              {MODES.map(m => {
                const isActive = m.mode === tab;
                return (
                  <TouchableOpacity
                    key={m.mode}
                    testID={`audioMode-${m.mode}`}
                    onPress={() => handleSelectMode(m.mode)}
                    style={[styles.tab, isActive && styles.tabActive]}
                  >
                    <Icon
                      name={m.icon}
                      size={22}
                      color={isActive ? 'white' : 'rgba(255,255,255,0.6)'}
                    />
                    <Text
                      numberOfLines={2}
                      style={[styles.tabText, isActive && styles.tabTextActive]}
                    >
                      {t(m.label)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              testID="audioSelectCloseBtn"
              onPress={handleClose}
              style={styles.close}
            >
              <Icon name="close" size={30} color="white" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.scrollView}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {pinned.map(x => (
              <AudioOption
                key={x.key}
                streamKey={x.key}
                text={x.text}
                onSelect={handleSetAudio}
              />
            ))}
            {rest.length > 0 && <View style={styles.divider} />}
            {rest.map(x => (
              <AudioOption
                key={x.key}
                streamKey={x.key}
                text={x.text}
                onSelect={handleSetAudio}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: '#1c1c1c',
    borderRadius: 5,
    padding: 15,
    height: '90%',
    width: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#4a4a4a',
  },
  tabText: {
    marginTop: 2,
    fontSize: 12,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 8,
  },
  close: {
    paddingLeft: 10,
    paddingVertical: 6,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
});
export default AudioSelectModal;
