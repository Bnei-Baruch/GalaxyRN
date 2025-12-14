import { CRISP_WEBSITE_ID } from '@env';
import { Platform } from 'react-native';
import {
  configure,
  resetSession,
  setTokenId,
  setUserEmail,
  setUserNickname,
  show,
} from 'react-native-crisp-chat-sdk';
import { create } from 'zustand';
import logger from '../services/logger';
import { useUserStore } from './user';

const NAMESPACE = 'Crisp';

let isInitialized = false;

export const useCrispStore = create((set, get) => ({
  start: () => {
    if (isInitialized) {
      try {
        resetSession();
        logger.info(
          NAMESPACE,
          'Crisp is already initialized, showing chat window'
        );
        show();
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
      //TODO: check if this is needed
      if (Platform.OS === 'android') {
        logger.info(NAMESPACE, 'Configuring Crisp SDK for Android');
        configure(CRISP_WEBSITE_ID);
      } else {
        logger.info(NAMESPACE, 'Using pre-configured Crisp SDK for iOS');
      }

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
        show();
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
