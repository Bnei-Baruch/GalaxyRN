import { AppRegistry, I18nManager, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { initEnv } from './src/services/env';

// Disable the on-screen LogBox overlays in dev. They stack at the bottom of the screen and cover
// interactive elements (e.g. the room "Select Ten" trigger), which both blocks manual use and
// breaks Maestro E2E. Warnings/errors still print to the Metro console. No effect in release.
if (__DEV__) {
  //LogBox.ignoreAllLogs(true);
}

I18nManager.forceRTL(false);
I18nManager.allowRTL(false);

initEnv();
AppRegistry.registerComponent(appName, () => App);
