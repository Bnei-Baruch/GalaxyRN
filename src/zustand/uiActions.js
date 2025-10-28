// React Native modules
import { Dimensions } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';

// External libraries
import { create } from 'zustand';

// Services
import logger from '../services/logger';

// Zustand stores
import { useFeedsStore } from './feeds';
import { HIDE_BARS_TIMEOUT_MS } from './helper';
import { useSettingsStore } from './settings';

const NAMESPACE = 'UiActions';

let lastTimestemp = 0;
let showBarTimeout = null;

const getBorders = async (scrollPos, feedsPos, currentBorders) => {
  lastTimestemp = Date.now();
  const currentTimestamp = lastTimestemp;
  await new Promise(r => BackgroundTimer.setTimeout(r, 500));

  if (lastTimestemp !== currentTimestamp) return null;

  let top = scrollPos - feedsPos;
  let bottom = top + Dimensions.get('window').height;

  if (currentBorders.top === top && currentBorders.bottom === bottom) {
    return null;
  }

  return { top, bottom };
};

export const useUiActions = create((set, get) => ({
  borders: { top: 0, bottom: 0 },

  feedsScrollY: 0,
  setFeedsScrollY: async feedsScrollY => {
    const borders = await getBorders(
      feedsScrollY,
      get().feedsPos,
      get().borders
    );
    if (borders) set({ feedsScrollY, borders });
  },

  feedsPos: 0,
  setFeedsPos: async feedsPos => {
    const borders = await getBorders(
      get().feedsScrollY,
      feedsPos,
      get().borders
    );
    if (borders) set({ feedsPos, borders });
  },

  width: 0,
  updateWidth: (isShidur, feedLength) => {
    logger.debug(NAMESPACE, 'updateWidth', isShidur, feedLength);
    let { height, width } = Dimensions.get('window');
    let newWidth;

    if (height >= width) {
      newWidth = parseInt(width / 2, 10);
    } else {
      const { isShidur: _isShidur, hideSelf } = useSettingsStore.getState();
      isShidur = isShidur ?? _isShidur;

      feedLength =
        feedLength ?? Object.keys(useFeedsStore.getState().feedById).length;
      const num = feedLength + (hideSelf ? 0 : 1);
      logger.debug('UiActions', 'updateWidth', num);

      if (isShidur) {
        newWidth = parseInt(((height / 4) * 16) / 9, 10);
      } else {
        width = width - 56;

        if (num <= 4) {
          newWidth = parseInt(((height / 2) * 16) / 9, 10);
        } else if (num <= 9) {
          newWidth = parseInt(((height / 3) * 16) / 9, 10);
        } else {
          newWidth = parseInt(width / 4, 10);
        }
      }
    }

    // Обновляем только если значение изменилось
    if (get().width !== newWidth) {
      set({ width: newWidth });
    }
  },

  showBars: true,
  toggleShowBars: (hideOnTimeout, showBars = !get().showBars) => {
    logger.debug(NAMESPACE, 'toggleShowBars', hideOnTimeout, showBars);
    if (showBarTimeout) {
      BackgroundTimer.clearTimeout(showBarTimeout);
    }
    if (hideOnTimeout && showBars) {
      showBarTimeout = BackgroundTimer.setTimeout(
        () => set({ showBars: false }),
        HIDE_BARS_TIMEOUT_MS
      );
    }
    set({ showBars });
  },
}));
