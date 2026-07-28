module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // The whitelist here MUST include `react-native` itself — its entry (react-native/index.js)
  // uses `import typeof`, which needs Babel. Omitting it caused
  // "Cannot use import statement outside a module" on react-native/index.js. Plus the RN-ecosystem
  // packages that ship untranspiled ESM/Flow.
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?(' +
      [
        'buffer',
        '@react-native',
        'react-native',
        '@react-native-community',
        '@react-navigation',
        'react-native-.*',
        '@sentry/.*',
        'immer',
        'zustand',
      ].join('|') +
      ')/)',
  ],
};
