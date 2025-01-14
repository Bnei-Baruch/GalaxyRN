import { create } from 'zustand';
import { Dimensions } from 'react-native';

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
}));