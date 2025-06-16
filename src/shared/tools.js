import BackgroundTimer from 'react-native-background-timer';
import RNSecureStorage, { ACCESSIBLE } from 'rn-secure-storage';
import logger from '../services/logger';

const NAMESPACE = 'Tools';

export const sleep = time =>
  new Promise(resolve => BackgroundTimer.setTimeout(resolve, time));

export const getFromStorage = async (key, def) => {
  let res;
  try {
    res = await RNSecureStorage.getItem(key);
  } catch (err) {
    res = def;
    logger.log(NAMESPACE, 'RNSecureStorage getFromStorage', err);
  }
  return res;
};

export const setToStorage = async (key, val) => {
  try {
    return await RNSecureStorage.setItem(key, val.toString(), {
      accessible: ACCESSIBLE.ALWAYS,
    });
  } catch (err) {
    logger.error(NAMESPACE, 'RNSecureStorage setToStorage error', err);
    return err;
  }
};

export const deepClone = obj => {
  return JSON.parse(JSON.stringify(obj));
};

export const randomString = len => {
  let charSet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomVal = '';
  for (let i = 0; i < len; i++) {
    let randomPoz = Math.floor(Math.random() * charSet.length);
    randomVal += charSet.substring(randomPoz, randomPoz + 1);
  }
  return randomVal;
};

export const getDateString = jsonDate => {
  var when = new Date();
  if (jsonDate) {
    when = new Date(Date.parse(jsonDate));
    if (isNaN(when.getTime()) && jsonDate.length > 2) {
      // Fix some edge cases where : missing to be valid ISO 8601 format.
      const len = jsonDate.length;
      when = new Date(
        Date.parse(`${jsonDate.slice(0, len - 2)}:${jsonDate.slice(len - 2)}`)
      );
    }
  }
  var dateString =
    ('0' + when.getHours()).slice(-2) +
    ':' +
    ('0' + when.getMinutes()).slice(-2) +
    ':' +
    ('0' + when.getSeconds()).slice(-2);
  return dateString;
};
