import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import logger from '../../services/logger';
import { useInitsStore } from '../../zustand/inits';
import { useUiActions } from '../../zustand/uiActions';
import ButtonsPaneLandscape from './ButtonsPaneLandscape';
import ButtonsPanePortrait from './ButtonsPanePortrait';

const NAMESPACE = 'ButtonsPaneModal';

const PANEL_ANIMATION_IN = 200;
const PANEL_ANIMATION_OUT = 150;

const getTranslateYValue = styleRef => {
  const flattened = StyleSheet.flatten(styleRef);
  if (!flattened || !Array.isArray(flattened.transform)) {
    return 0;
  }
  const translateEntry = flattened.transform.find(
    entry => entry && Object.prototype.hasOwnProperty.call(entry, 'translateY')
  );
  if (!translateEntry) {
    return 0;
  }
  return normalizeTranslateValue(translateEntry.translateY);
};

const normalizeTranslateValue = value => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
      const percent = parseFloat(trimmed.slice(0, -1));
      if (!Number.isNaN(percent)) {
        return (percent / 100) * Dimensions.get('window').height;
      }
    }
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
  }
  return 0;
};

const ButtonsPaneModal = () => {
  const { toggleMoreModal, moreModal } = useUiActions();
  const { isPortrait } = useInitsStore();
  const [shouldRenderModal, setShouldRenderModal] = useState(moreModal);
  const modalVisible = moreModal || shouldRenderModal;

  const translateYStart = useMemo(
    () => getTranslateYValue(styles.panelWrapperTopStart),
    [isPortrait]
  );
  const translateYEnd = useMemo(
    () => getTranslateYValue(styles.panelWrapperTopEnd),
    [isPortrait]
  );
  const translateYBottomStart = useMemo(
    () => getTranslateYValue(styles.panelWrapperBottomStart),
    [isPortrait]
  );
  const translateYBottomEnd = useMemo(
    () => getTranslateYValue(styles.panelWrapperBottomEnd),
    [isPortrait]
  );
  const panelEntrance = useRef(new Animated.Value(0)).current;

  const animatedTopPanelStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: panelEntrance.interpolate({
            inputRange: [0, 1],
            outputRange: [translateYStart, translateYEnd],
            extrapolate: 'clamp',
          }),
        },
      ],
    }),
    [panelEntrance, translateYStart, translateYEnd]
  );

  const animatedBottomPanelStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: panelEntrance.interpolate({
            inputRange: [0, 1],
            outputRange: [translateYBottomStart, translateYBottomEnd],
            extrapolate: 'clamp',
          }),
        },
      ],
    }),
    [panelEntrance, translateYBottomStart, translateYBottomEnd]
  );

  useEffect(() => {
    if (!moreModal) {
      return;
    }
    setShouldRenderModal(true);
    panelEntrance.stopAnimation();
    const animation = Animated.timing(panelEntrance, {
      toValue: 1,
      duration: PANEL_ANIMATION_IN,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => {
      animation.stop();
    };
  }, [moreModal, panelEntrance]);

  useEffect(() => {
    if (moreModal || !shouldRenderModal) {
      return;
    }
    panelEntrance.stopAnimation();
    let isCancelled = false;
    const animation = Animated.timing(panelEntrance, {
      toValue: 0,
      duration: PANEL_ANIMATION_OUT,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !isCancelled) {
        setShouldRenderModal(false);
      }
    });

    return () => {
      isCancelled = true;
      animation.stop();
    };
  }, [moreModal, panelEntrance, shouldRenderModal]);

  const handleClose = () => {
    logger.debug(NAMESPACE, 'handleClose');
    logger.debug(NAMESPACE, 'toggleMoreModal');
    toggleMoreModal(false);
    logger.debug(NAMESPACE, 'toggleMoreModal done');
  };

  return (
    <View style={styles.container}>
      <Modal
        animationType="fade"
        presentationStyle="overFullScreen"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleClose}
        supportedOrientations={['portrait', 'landscape']}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={[styles.modalContainer]}>
            {isPortrait ? (
              <ButtonsPanePortrait
                animatedTopPanelStyle={animatedTopPanelStyle}
                animatedBottomPanelStyle={animatedBottomPanelStyle}
              />
            ) : (
              <ButtonsPaneLandscape
                animatedTopPanelStyle={animatedTopPanelStyle}
                animatedBottomPanelStyle={animatedBottomPanelStyle}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  panelWrapperTopStart: {
    transform: [{ translateY: '-50%' }],
  },
  panelWrapperTopEnd: {
    transform: [{ translateY: 0 }],
  },
  panelWrapperBottomStart: {
    transform: [{ translateY: '100%' }],
  },
  panelWrapperBottomEnd: {
    transform: [{ translateY: 0 }],
  },
});
export default ButtonsPaneModal;
