import { CRISP_WEBSITE_ID } from '@env';
import {
  configure,
  resetSession,
  setTokenId,
  setUserEmail,
  setUserNickname,
  show,
} from 'react-native-crisp-chat-sdk';
import { Platform } from 'react-native';
import { create } from 'zustand';
import GxyUIStateBridge from '../services/GxyUIStateBridge';
import logger from '../services/logger';
import { useUserStore } from './user';

const NAMESPACE = 'Crisp';

let isInitialized = false;

// Opening Crisp's ChatActivity triggers onUserLeaveHint on Android, which would
// otherwise put the room into PIP behind the chat.
const showChat = () => {
  if (Platform.OS === 'android') {
    GxyUIStateBridge.suppressNextPip();
  }
  show();
};

export const useCrispStore = create((set, get) => ({
  start: () => {
    if (isInitialized) {
      try {
        resetSession();
        logger.info(
          NAMESPACE,
          'Crisp is already initialized, showing chat window'
        );
        showChat();
      } catch (showError) {
        logger.error(NAMESPACE, 'Crisp show failed', showError);
      }
      return;
    }

    try {
      const { display, email, id } = useUserStore.getState().user || {};
      logger.debug(
        NAMESPACE,
        'Crisp configuration',
        CRISP_WEBSITE_ID,
        email,
        display,
        id
      );
      configure(CRISP_WEBSITE_ID);

      try {
        if (email) {
          logger.debug(NAMESPACE, 'Setting user email:', email);
          setUserEmail(email);
        }

        if (display) {
          logger.debug(NAMESPACE, 'Setting user nickname:', display);
          setUserNickname(display);
        }

        if (id) {
          const cleanId = id.toString().replace(/[";'\s]/g, '');
          logger.debug(NAMESPACE, 'Setting user token ID:', cleanId);
          setTokenId(cleanId);
        }
      } catch (userInfoError) {
        logger.error(NAMESPACE, 'Error setting user info:', userInfoError);
      }

      try {
        logger.info(NAMESPACE, 'Attempting to show Crisp chat');
        showChat();
        isInitialized = true;
        logger.info(NAMESPACE, 'Crisp chat initialized successfully');
      } catch (showError) {
        logger.error(NAMESPACE, 'Crisp show failed with error:', showError);
        if (showError.message) {
          logger.error(NAMESPACE, 'Error message:', showError.message);
        }
        isInitialized = false;
      }
    } catch (error) {
      isInitialized = false;
      logger.error(NAMESPACE, 'Crisp initialization failed', error);
      if (error.message) {
        logger.error(NAMESPACE, 'Error message:', error.message);
      }
      if (error.stack) {
        logger.error(NAMESPACE, 'Error stack:', error.stack);
      }
    }
  },
}));
