const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  server: {
    port: 8081,
  },
  // Improve watchman performance
  watchFolders: [__dirname],
  resolver: {
    // Add any custom resolver settings if needed
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
    // Exclude android and ios native resources from being resolved as modules
    blockList: [
      /android\/app\/src\/main\/res\/.*/,
      /android\/app\/build\/.*/,
      /ios\/build\/.*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
