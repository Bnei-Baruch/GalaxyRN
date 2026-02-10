import { AppRegistry, I18nManager } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { initEnv } from './src/services/env';

I18nManager.forceRTL(false);
I18nManager.allowRTL(false);

initEnv();
AppRegistry.registerComponent(appName, () => App);
