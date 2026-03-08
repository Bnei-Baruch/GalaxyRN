const pkg = require('./package.json');

const { isProduction = true } = pkg?.config;
console.log('isProduction', isProduction, 'pkg', pkg.config);

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', { moduleName: '@env', path: isProduction ? '.env' : '.env.dev' }],
  ],
};