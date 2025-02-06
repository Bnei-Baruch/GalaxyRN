import { create } from 'zustand';
import { PermissionsAndroid, NativeModules, NativeEventEmitter } from 'react-native';
import mqtt from '../shared/mqtt';
import log from 'loglevel';
import { useUserStore } from './user';
import { geoInfo } from '../shared/tools';
import { GEO_IP_INFO } from '@env';
import api from '../shared/Api';
import ConfigStore from '../shared/ConfigStore';
import GxyConfig from '../shared/janus-config';
import InCallManager from 'react-native-incall-manager';
import { useInRoomStore } from './inRoom';
import { useSettingsStore } from './settings';
import { useMyStreamStore } from './myStream';
import { useShidurStore } from './shidur';
import kc from '../auth/keycloak';

const { AppModule } = NativeModules;
const eventEmitter  = new NativeEventEmitter(AppModule);
let subscription;

async function checkPermission(permission) {
  try {
    const granted = await PermissionsAndroid.check(permission);
    if (granted) {
      log.debug(`permission ${permission} granted`);
      return true;
    } else {
      log.debug(`permission ${permission} denied`);
      return await requestPermission(permission);
    }
  } catch (err) {
    console.warn(err);
    return false;
  }
}

async function requestPermission(permission) {
  try {
    const granted = await PermissionsAndroid.request(
      permission,
      {
        title         : `${permission} Permission`,
        message       : `Arvut needs access to your ${permission}`,
        buttonNeutral : 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
}

export const useInitsStore = create((set, get) => ({
  isBridgeReady  : false,
  mqttReady      : false,
  configReady    : false,
  isPortrait     : true,
  initBridge     : () => set({ isBridgeReady: true }),
  setIsPortrait  : isPortrait => set({ isPortrait }),
  initPermissions: async () => {
    if (!await checkPermission('android.permission.CAMERA'))
      return false;
    if (!await checkPermission('android.permission.RECORD_AUDIO'))
      return false;
    await checkPermission('android.permission.POST_NOTIFICATIONS');
    await checkPermission('android.permission.BLUETOOTH');
    await checkPermission('android.permission.BLUETOOTH_ADMIN');
    await checkPermission('android.permission.BLUETOOTH_CONNECT');
    console.log('useInitsStore initPermissions all checked');
    return true;
  },
  initMQTT       : () => {
    const { user } = useUserStore.getState();
    mqtt.init(user, (reconnected, error) => {
      if (error) {
        log.info('[client] MQTT disconnected');
        set(() => ({ mqttReady: false }));
        alert('- Lost Connection to Arvut System -');
      } else if (reconnected) {
        set(() => ({ mqttReady: true }));
        log.info('[client] MQTT reconnected');
      } else {
        set(() => ({ mqttReady: true }));

        mqtt.join('galaxy/users/notification');
        mqtt.join('galaxy/users/broadcast');

        const { user, setUser }             = useUserStore.getState();
        const { toggleCammute, toggleMute } = useMyStreamStore.getState();
        const { streamGalaxy }              = useShidurStore.getState();
        const { toggleQuestion }            = useSettingsStore.getState();
        const { updateDisplayById }         = useInRoomStore.getState();
        const { exitRoom }                  = useInRoomStore.getState();

        mqtt.watch(data => {
          const { type, id, bitrate } = data;

          if (user.id === id && ['client-reconnect', 'client-reload', 'client-disconnect'].includes(type)) {
            exitRoom()
          } else if (type === 'client-kicked' && user.id === id) {
            kc.logout();
          } else if (type === 'client-question' && user.id === id) {
            toggleQuestion();
          } else if (type === 'client-mute' && user.id === id) {
            toggleMute();
          } else if (type === 'video-mute' && user.id === id) {
            toggleCammute();
          } else if (type === 'audio-out') {
            streamGalaxy(data.status);
            if (data.status) {
              // remove question mark when sndman unmute our room
              toggleQuestion(false);
            }
          } else if (type === 'reload-config') {
            //this.reloadConfig();
          } else if (type === 'client-reload-all') {
            exitRoom()
          } else if (type === 'client-state') {
            updateDisplayById(data.user);
          }

        });
      }
    });
  },
  endMqtt        : async () => {
    await mqtt.end();
    set(() => ({ mqttReady: false, configReady: false }));
  },
  initConfig     : () => {
    const userInfo = {};
    return geoInfo(GEO_IP_INFO, (data) => {
      userInfo.ip      = data && data.ip ? data.ip : '127.0.0.1';
      userInfo.country = data && data.country ? data.country : 'XX';

      //setUserInfo(userInfo)

      return api.fetchConfig().then((data) => {
        log.debug('[client] got config: ', data);
        ConfigStore.setGlobalConfig(data);
        /*
        const premodStatus = ConfigStore.dynamicConfig(ConfigStore.PRE_MODERATION_KEY) === "true";
        this.setState({premodStatus});
        */
        GxyConfig.setGlobalConfig(data);
        set(() => ({ configReady: true }));
      }).catch((err) => {
        log.error('[client] error initializing app', err);
        //this.setState({appInitError: err});
      });
    });
  },
  initApp        : () => {
    InCallManager.start({ media: 'video' });
    InCallManager.setKeepScreenOn(true);
    InCallManager.chooseAudioRoute('BLUETOOTH');

    subscription = eventEmitter.addListener('AppTerminated', async () => {
      await useInRoomStore.getState().exitRoom();
      get().terminateApp();
    });
  },
  terminateApp   : () => {
    InCallManager.setKeepScreenOn(false);
    InCallManager.stop();
    subscription?.remove();

  }
}));