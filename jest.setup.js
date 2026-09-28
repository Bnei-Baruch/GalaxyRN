// Mock для BackgroundTimer facade (src/services/BackgroundTimer.js)
jest.mock('./src/services/BackgroundTimer', () => ({
  setTimeout: jest.fn((fn, delay) => setTimeout(fn, delay)),
  clearTimeout: jest.fn(),
  setInterval: jest.fn(),
  clearInterval: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
}));

// Mock для rn-secure-storage
jest.mock('rn-secure-storage', () => ({
  exist: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  ACCESSIBLE: {
    ALWAYS: 'ALWAYS',
  },
}));

// Mock для logger
jest.mock('./src/services/logger', () => ({
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));
