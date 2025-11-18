// Mock для react-native-background-timer
jest.mock('react-native-background-timer', () => ({
  setTimeout: jest.fn((fn, delay) => setTimeout(fn, delay)),
  clearTimeout: jest.fn(),
  setInterval: jest.fn(),
  clearInterval: jest.fn(),
}));

// Mock для rn-secure-storage
jest.mock('rn-secure-storage', () => ({
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
