import { create } from 'zustand';

export const useUiActions = create((set) => ({
  feedsScrollY   : 0,
  setFeedsScrollY: (feedsScrollY) => set({ feedsScrollY }),
  feedsPos       : 0,
  setFeedsPos    : (feedsPos) => set({ feedsPos }),
}));