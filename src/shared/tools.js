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

const h265Config = {
  profileSpace: 0,
  profileId: 1, // Main Profile
  tierFlag: 0, // Main Tier
  levelId: 93, // Level 3.1
};

export const addH265ProfileToSDP = sdp => {
  var lines = sdp.split('\n');
  var h265PayloadType = null;

  // Найти H.265 payload type
  for (var i = 0; i < lines.length; i++) {
    if (
      lines[i].indexOf('a=rtpmap:') === 0 &&
      (lines[i].toLowerCase().indexOf('h265') !== -1 ||
        lines[i].toLowerCase().indexOf('hevc') !== -1)
    ) {
      h265PayloadType = lines[i].split(':')[1].split(' ')[0];
      break;
    }
  }

  if (h265PayloadType) {
    // Создать fmtp строку для H.265
    var fmtpLine = `a=fmtp:${h265PayloadType} profile-space=${h265Config.profileSpace};profile-id=${h265Config.profileId};tier-flag=${h265Config.tierFlag};level-id=${h265Config.levelId}`;

    // Добавить в SDP
    var rtpmapIndex = -1;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].indexOf(`a=rtpmap:${h265PayloadType}`) === 0) {
        rtpmapIndex = i;
        break;
      }
    }

    if (rtpmapIndex !== -1) {
      lines.splice(rtpmapIndex + 1, 0, fmtpLine);
    }
  }

  return lines.join('\n');
};

export const parseSDPCodecs = sdp => {
  const lines = sdp.split('\n');
  const codecs = {};
  const payloadTypes = {};

  // Find rtpmap lines to get codec payload types
  lines.forEach(line => {
    const rtpmapMatch = line.match(/^a=rtpmap:(\d+)\s+([^/]+)/);
    if (rtpmapMatch) {
      const payloadType = rtpmapMatch[1];
      const codecName = rtpmapMatch[2].toLowerCase();
      payloadTypes[payloadType] = codecName;
    }
  });

  // Find fmtp lines and match with codecs
  lines.forEach(line => {
    const fmtpMatch = line.match(/^a=fmtp:(\d+)\s+(.+)/);
    if (fmtpMatch) {
      const payloadType = fmtpMatch[1];
      const fmtpParams = fmtpMatch[2];
      const codecName = payloadTypes[payloadType];

      if (codecName) {
        // Parse fmtp parameters into object
        const params = {};
        fmtpParams.split(/[;\s]+/).forEach(param => {
          const [key, value] = param.split('=');
          if (key && key.trim()) {
            params[key.trim()] = value ? value.trim() : true;
          }
        });

        codecs[codecName] = {
          payloadType: payloadType,
          fmtp: fmtpParams,
          parameters: params,
        };
      }
    }
  });

  return codecs;
};

export const parseH265Profile = sdp => {
  const lines = sdp.split('\n');
  let h265Profile = null;

  // Find H.265/HEVC codec info
  lines.forEach(line => {
    if (line.indexOf('a=rtpmap:') === 0) {
      if (
        line.toLowerCase().indexOf('h265') !== -1 ||
        line.toLowerCase().indexOf('hevc') !== -1
      ) {
        const parts = line.split(' ');
        if (parts.length > 1) {
          const payloadType = parts[0].split(':')[1];
          const codecName = parts[1];
          h265Profile = {
            payloadType,
            codecName,
            found: true,
          };
        }
      }
    }

    // Parse fmtp parameters for H.265
    if (
      h265Profile &&
      line.indexOf(`a=fmtp:${h265Profile.payloadType}`) === 0
    ) {
      const fmtpParams = line.split(' ').slice(1).join(' ');
      const params = {};

      fmtpParams.split(/[;\s]+/).forEach(param => {
        const [key, value] = param.split('=');
        if (key && key.trim()) {
          params[key.trim()] = value ? value.trim() : true;
        }
      });

      h265Profile.fmtp = fmtpParams;
      h265Profile.parameters = params;
    }
  });

  return h265Profile || { found: false };
};

/**
 * Optimizes H.264 parameters for MediaTek devices to avoid decoder issues
 * Reduces profile level and adds compatibility parameters
 */
export const optimizeH264ForMediaTek = sdp => {
  const lines = sdp.split('\n');
  const optimizedLines = [];

  lines.forEach(line => {
    if (
      line.indexOf('a=fmtp:') === 0 &&
      (line.toLowerCase().includes('h264') ||
        line.toLowerCase().includes('avc'))
    ) {
      // Extract payload type
      const payloadType = line.split(':')[1].split(' ')[0];

      // Optimize H.264 parameters for MediaTek compatibility
      const optimizedParams = [
        'profile-level-id=42001e', // Baseline Profile Level 3.0 (more compatible than 3.1)
        'packetization-mode=1', // Single NAL unit mode
        'level-asymmetry-allowed=1', // Allow asymmetric levels
        'max-fs=3600', // Max frame size (lower for stability)
        'max-mbps=40500', // Max macroblock processing rate
        'max-br=768', // Max bitrate in kbps (conservative)
      ];

      const optimizedLine = `a=fmtp:${payloadType} ${optimizedParams.join(
        ';'
      )}`;
      optimizedLines.push(optimizedLine);

      return;
    }

    // Keep all other lines unchanged
    optimizedLines.push(line);
  });

  return optimizedLines.join('\n');
};

/**
 * Forces software H.264 decoding by removing hardware acceleration hints
 * Helps avoid MediaTek hardware decoder buffer issues
 */
export const forceSoftwareDecoding = sdp => {
  const lines = sdp.split('\n');
  const modifiedLines = [];

  lines.forEach(line => {
    // Remove hardware acceleration attributes that might trigger hardware decoder
    if (
      line.includes('a=extmap:') &&
      (line.includes('video-orientation') || line.includes('framemarking'))
    ) {
      // Skip hardware-specific extensions
      return;
    }

    // Keep all other lines
    modifiedLines.push(line);
  });

  return modifiedLines.join('\n');
};

/**
 * Reduces video complexity for problematic MediaTek devices
 * Lowers resolution and frame rate expectations
 */
export const reduceVideoComplexity = sdp => {
  const lines = sdp.split('\n');
  const modifiedLines = [];

  lines.forEach(line => {
    if (
      line.indexOf('a=fmtp:') === 0 &&
      (line.toLowerCase().includes('h264') ||
        line.toLowerCase().includes('avc'))
    ) {
      const payloadType = line.split(':')[1].split(' ')[0];

      // Add conservative parameters for MediaTek devices
      const conservativeParams = line.includes(';')
        ? line + ';max-fs=1200;max-mbps=11880;max-br=384'
        : line + ' max-fs=1200;max-mbps=11880;max-br=384';

      modifiedLines.push(conservativeParams);
      return;
    }

    modifiedLines.push(line);
  });

  return modifiedLines.join('\n');
};
