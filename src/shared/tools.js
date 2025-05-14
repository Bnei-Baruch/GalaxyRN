import RNSecureStorage, { ACCESSIBLE } from "rn-secure-storage";
import BackgroundTimer from "react-native-background-timer";

export const sleep = (time) =>
  new Promise((resolve) => BackgroundTimer.setTimeout(resolve, time));

export const getFromStorage = async (key, def) => {
  try {
    return await RNSecureStorage.getItem(key);
  } catch (err) {
    return def;
  }
};
export const setToStorage = async (key, val) => {
  try {
    return await RNSecureStorage.setItem(key, val.toString(), {
      accessible: ACCESSIBLE.ALWAYS,
    });
  } catch (err) {
    console.error("RNSecureStorage setToStorage error", err);
    return err;
  }
};

export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};
