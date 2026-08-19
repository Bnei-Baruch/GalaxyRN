/**
 * @format
 * Unit tests for src/services/BackgroundTimer.js's interval re-arm logic.
 * jest.setup.js globally mocks this module for other tests; unmock it here
 * so we can exercise the real implementation.
 */
jest.unmock('../src/services/BackgroundTimer');

jest.mock('../src/specs/NativeBackgroundTimerModule', () => ({
  __esModule: true,
  default: {
    setTimeout: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    timeout: jest.fn(),
  },
}));
jest.mock('../src/specs/NativeBackgroundTimer', () => ({
  __esModule: true,
  default: {
    setTimeout: jest.fn(),
    timeout: jest.fn(),
  },
}));

import { Platform } from 'react-native';

describe('BackgroundTimer facade', () => {
  let BackgroundTimer;
  let NativeBackgroundTimerModule;

  beforeEach(() => {
    jest.resetModules();
    Platform.OS = 'android';
    NativeBackgroundTimerModule = require('../src/specs/NativeBackgroundTimerModule').default;
    BackgroundTimer = require('../src/services/BackgroundTimer').default;
    NativeBackgroundTimerModule.setTimeout.mockClear();
  });

  it('re-arms the native timer when the interval callback does not clear itself', () => {
    const callback = jest.fn();
    const id = BackgroundTimer.setInterval(callback, 1000);
    NativeBackgroundTimerModule.setTimeout.mockClear();

    BackgroundTimer._onTimeout(id);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(NativeBackgroundTimerModule.setTimeout).toHaveBeenCalledWith(id, 1000);
  });

  it('does not re-arm when the callback clears the interval on itself (mqtt keepalive-timeout case)', () => {
    let id;
    const callback = jest.fn(() => BackgroundTimer.clearInterval(id));
    id = BackgroundTimer.setInterval(callback, 1000);
    NativeBackgroundTimerModule.setTimeout.mockClear();

    BackgroundTimer._onTimeout(id);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(NativeBackgroundTimerModule.setTimeout).not.toHaveBeenCalled();
  });

  it('ignores a late native fire for an id that no longer has an entry', () => {
    const callback = jest.fn();
    const id = BackgroundTimer.setInterval(callback, 1000);
    BackgroundTimer.clearInterval(id);
    NativeBackgroundTimerModule.setTimeout.mockClear();

    expect(() => BackgroundTimer._onTimeout(id)).not.toThrow();
    expect(callback).not.toHaveBeenCalled();
    expect(NativeBackgroundTimerModule.setTimeout).not.toHaveBeenCalled();
  });

  it('clears a one-shot timeout before invoking its callback and does not re-arm', () => {
    const callback = jest.fn();
    const id = BackgroundTimer.setTimeout(callback, 500);
    NativeBackgroundTimerModule.setTimeout.mockClear();

    BackgroundTimer._onTimeout(id);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(NativeBackgroundTimerModule.setTimeout).not.toHaveBeenCalled();
  });
});
