/**
 * @format
 * Unit tests for the pure helpers in src/tools.js.
 * Native deps (rn-secure-storage, react-native-background-timer, logger) are mocked in jest.setup.js.
 */

import { Buffer } from 'buffer';
import RNSecureStorage from 'rn-secure-storage';
import {
  fixTextEncoding,
  deepClone,
  randomString,
  getDateString,
  noop,
  rejectTimeoutPromise,
  getFromStorage,
  setToStorage,
  getBooleanFromStorage,
} from '../src/tools';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fixTextEncoding', () => {
  it('returns empty string for null / non-string input', () => {
    expect(fixTextEncoding(null)).toBe('');
    expect(fixTextEncoding(undefined)).toBe('');
    expect(fixTextEncoding(42)).toBe('');
  });

  it('passes through text that is not mis-encoded', () => {
    expect(fixTextEncoding('Hello world')).toBe('Hello world');
  });

  it('fixes UTF-8 bytes that were mis-decoded as latin1 (mojibake)', () => {
    // Build the mojibake deterministically (source-file-encoding independent):
    // real UTF-8 bytes of the Cyrillic string, mis-read as latin1 — exactly what
    // fixTextEncoding is designed to reverse.
    const mojibake = Buffer.from('Леонтьев', 'utf-8').toString('latin1');
    expect(fixTextEncoding(mojibake)).toBe('Леонтьев');
  });
});

describe('deepClone', () => {
  it('produces an independent deep copy', () => {
    const src = { a: 1, nested: { b: [1, 2, 3] } };
    const clone = deepClone(src);
    expect(clone).toEqual(src);
    expect(clone).not.toBe(src);
    clone.nested.b.push(4);
    expect(src.nested.b).toEqual([1, 2, 3]);
  });
});

describe('randomString', () => {
  it('returns a string of the requested length from the allowed charset', () => {
    const s = randomString(16);
    expect(s).toHaveLength(16);
    expect(s).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('returns empty string for length 0', () => {
    expect(randomString(0)).toBe('');
  });
});

describe('getDateString', () => {
  it('formats a given ISO date as zero-padded HH:MM:SS', () => {
    const out = getDateString('2020-01-02T03:04:05Z');
    expect(out).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('returns a valid time string when called with no argument', () => {
    expect(getDateString()).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('recovers from an ISO string missing the tz-offset colon without throwing', () => {
    expect(() => getDateString('2020-01-02T03:04:05+0300')).not.toThrow();
    expect(getDateString('2020-01-02T03:04:05+0300')).toMatch(
      /^\d{2}:\d{2}:\d{2}$/
    );
  });
});

describe('noop', () => {
  it('is callable and returns undefined', () => {
    expect(noop()).toBeUndefined();
  });
});

describe('rejectTimeoutPromise', () => {
  it('resolves with the inner promise value when it wins the race', async () => {
    await expect(rejectTimeoutPromise(Promise.resolve('ok'), 1000)).resolves.toBe(
      'ok'
    );
  });

  it('rejects with a Timeout error when the inner promise is too slow', async () => {
    const never = new Promise(() => {});
    await expect(rejectTimeoutPromise(never, 10)).rejects.toThrow(
      'Timeout after 10ms'
    );
  });
});

describe('storage helpers', () => {
  it('getFromStorage returns default when the key does not exist', async () => {
    RNSecureStorage.exist.mockResolvedValue(false);
    await expect(getFromStorage('missing', 'def')).resolves.toBe('def');
    expect(RNSecureStorage.getItem).not.toHaveBeenCalled();
  });

  it('getFromStorage returns the stored value when the key exists', async () => {
    RNSecureStorage.exist.mockResolvedValue(true);
    RNSecureStorage.getItem.mockResolvedValue('stored');
    await expect(getFromStorage('k', 'def')).resolves.toBe('stored');
  });

  it('getFromStorage falls back to default when getItem throws', async () => {
    RNSecureStorage.exist.mockResolvedValue(true);
    RNSecureStorage.getItem.mockRejectedValue(new Error('boom'));
    await expect(getFromStorage('k', 'def')).resolves.toBe('def');
  });

  it('setToStorage writes the stringified value with ACCESSIBLE.ALWAYS', async () => {
    RNSecureStorage.setItem.mockResolvedValue('done');
    await setToStorage('k', true);
    expect(RNSecureStorage.setItem).toHaveBeenCalledWith('k', 'true', {
      accessible: 'ALWAYS',
    });
  });

  it('getBooleanFromStorage maps the "true" string to boolean true, else false', async () => {
    RNSecureStorage.exist.mockResolvedValue(true);
    RNSecureStorage.getItem.mockResolvedValueOnce('true');
    await expect(getBooleanFromStorage('k', 'false')).resolves.toBe(true);
    RNSecureStorage.getItem.mockResolvedValueOnce('nope');
    await expect(getBooleanFromStorage('k', 'false')).resolves.toBe(false);
  });
});
