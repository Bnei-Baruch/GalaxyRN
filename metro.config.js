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
    // Packages with an "exports" map (e.g. ws, mqtt) need the "browser"
    // condition active - their "default"/Node entry point requires
    // net/tls/dns/crypto, which RN doesn't provide. Do NOT try to steer
    // mqtt away from its "browser" dist bundle: build/index.js pulls in
    // Node-only transports (e.g. build/lib/connect/socks.js needs `dns`)
    // that Metro cannot bundle for RN at all - this isn't a cache/resolver
    // problem, the module graph is genuinely unbuildable that way. Patch
    // dist/mqtt.min.js / dist/mqtt.esm.js directly instead (see
    // .yarn/patches/mqtt-*).
    unstable_conditionNames: ['react-native', 'browser'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
