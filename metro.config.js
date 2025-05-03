const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const os = require('os');

// Get network interfaces
const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal/non-IPv4 interfaces
      if (iface.internal || iface.family !== 'IPv4') {
        continue;
      }
      return iface.address;
    }
  }
  return '127.0.0.1'; // Fallback to localhost
};

const localIp = getLocalIpAddress();
console.log(`Metro bundler using IP: ${localIp}`);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  server: {
    port: 8081,
    // Enable all hosts to allow connections from network
    host: '0.0.0.0',
  },
  // Explicitly set the URL that the client should connect to
  // This is important for devices connecting to the development server
  extra: {
    // The IP from which devices should connect to metro
    // This fixes issues with specific IP addresses like the 10.65.23.85 error
    host: localIp,
  },
  // Improve watchman performance
  watchFolders: [__dirname],
  resolver: {
    // Add any custom resolver settings if needed
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
