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
    logger.warn(NAMESPACE, 'RNSecureStorage getFromStorage', err);
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

export const noop = () => {};

/**
 * Fixes text encoding issues by detecting and correcting common misinterpretations
 * Handles UTF-8 misinterpreted as Latin-1, Windows-1252, and other common encoding problems
 * @param {string} text - The potentially garbled text to fix
 * @returns {string} - The properly decoded text
 */
export const fixTextEncoding = text => {
  if (!text || typeof text !== 'string') {
    return 'No name';
  }

  // Check if text likely needs decoding (contains UTF-8 bytes misinterpreted as other encodings)
  // Common indicators: Ð characters (Cyrillic), â€ sequences, Ã characters, etc.
  const hasEncodingIssues =
    /[\xC0-\xFF]/.test(text) &&
    (/Ð/.test(text) || // Cyrillic UTF-8 as Latin-1
      /â€/.test(text) || // Common UTF-8 as Windows-1252
      /Ã/.test(text) || // Accented chars UTF-8 as Latin-1
      /Â/.test(text)); // Non-breaking space and other issues

  if (!hasEncodingIssues) {
    return text; // Text is already properly encoded
  }

  try {
    // Convert string to bytes as if it was Latin-1
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      bytes[i] = text.charCodeAt(i);
    }

    // Use React Native's built-in TextDecoder to decode as UTF-8
    const decoder = new TextDecoder('utf-8');
    const decodedText = decoder.decode(bytes);

    // Return decoded text if it doesn't contain replacement characters
    return decodedText.includes('\uFFFD') ? text : decodedText;
  } catch (error) {
    // If decoding fails, return the original text
    console.warn('Text encoding fix failed:', error);
    return text;
  }
};
