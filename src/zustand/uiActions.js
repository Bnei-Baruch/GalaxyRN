import { create } from 'zustand';
import { Dimensions } from 'react-native';
import { useInRoomStore } from './inRoom';
import { useSettingsStore } from './settings';

let lastTimestemp = 0;

const getBorders = async (scrollPos, feedsPos) => {
  lastTimestemp          = Date.now();
  const currentTimestamp = lastTimestemp;
  await new Promise(r => setTimeout(r, 500));

  if (lastTimestemp !== currentTimestamp)
    return null;

  let top    = scrollPos - feedsPos;
  let bottom = top + Dimensions.get('window').height;

  return ({ top, bottom });
};

export const useUiActions = create((set, get) => ({
  borders        : { top: 0, bottom: 0 },
  feedsScrollY   : 0,
  setFeedsScrollY: async (feedsScrollY) => {
    const borders = await getBorders(feedsScrollY, get().feedsPos);
    if (borders)
      set({ feedsScrollY, borders });
  },
  feedsPos       : 0,
  setFeedsPos    : async (feedsPos) => {
    const borders = await getBorders(get().feedsScrollY, feedsPos);
    if (borders)
      set({ feedsPos, borders });
  },
  width          : 0,
  updateWidth    : (isShidur, feedLength) => {
    let { height, width } = Dimensions.get('window');

    if (height >= width) {
      set({ width: parseInt(width / 2, 10) });
      return;
    }

    const { isShidur: _isShidur, hideSelf } = useSettingsStore.getState();
    isShidur                                = isShidur ?? _isShidur;

    feedLength = feedLength ?? Object.keys(useInRoomStore.getState().feedById).length;
    const num  = feedLength + (hideSelf ? 0 : 1);
    console.log('updateWidth', num);

    if (isShidur) {
      set({ width: parseInt(height / 4 * 16 / 9, 10) });
      return;
    }
    width = width - 56;

    if (num <= 4) {
      set({ width: parseInt(height / 2 * 16 / 9, 10) });
      return;
    }
    if (num <= 9) {
      set({ width: parseInt(height / 3 * 16 / 9, 10) });
      return;
    }
    set({ width: parseInt(width / 4, 10) });
  }
}));