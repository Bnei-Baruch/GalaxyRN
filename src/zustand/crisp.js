import { create } from "zustand";
import * as CrispSDK from "react-native-crisp-chat-sdk";
import { CRISP_WEBSITE_ID } from "@env";
import { useUserStore } from "./user";
import { Platform } from "react-native";
import { debug, info, warn, error } from "../services/logger";

const NAMESPACE = 'Crisp';

let isInitialized = false;
export const useCrispStore = create((set, get) => ({
  start: () => {
    if (isInitialized) {
      try {
        CrispSDK.resetSession();
        info(NAMESPACE, "Crisp is already initialized, showing chat window");
        CrispSDK.show();
      } catch (showError) {
        error(NAMESPACE, "Crisp show failed", showError);
      }
      return;
    }
    try {
      const { display, email, id } = useUserStore.getState().user || {};
      debug(NAMESPACE, "Crisp configuration", CRISP_WEBSITE_ID, email, display, id);
      
      // Note: For iOS, the SDK may already be configured in AppDelegate.mm
      // For Android, we need to configure it here
      if (Platform.OS === 'android') {
        info(NAMESPACE, "Configuring Crisp SDK for Android");
        // First configure the SDK with the website ID
        CrispSDK.configure(CRISP_WEBSITE_ID);
      } else {
        info(NAMESPACE, "Using pre-configured Crisp SDK for iOS");
      }
      
      // Then set user info only if available
      try {
        if (email) {
          debug(NAMESPACE, "Setting user email:", email);
          CrispSDK.setUserEmail(email);
        }
        
        if (display) {
          debug(NAMESPACE, "Setting user nickname:", display);
          CrispSDK.setUserNickname(display);
        }
        
        if (id) {
          // Make sure user ID is also properly formatted
          const cleanId = id.toString().replace(/[";'\s]/g, '');
          debug(NAMESPACE, "Setting user token ID:", cleanId);
          CrispSDK.setTokenId(cleanId);
        }
      } catch (userInfoError) {
        error(NAMESPACE, "Error setting user info:", userInfoError);
        // Continue despite user info errors
      }
      
      try {
        info(NAMESPACE, "Attempting to show Crisp chat");
        CrispSDK.show();
        isInitialized = true;
        info(NAMESPACE, "Crisp chat initialized successfully");
      } catch (showError) {
        error(NAMESPACE, "Crisp show failed with error:", showError);
        if (showError.message) {
          error(NAMESPACE, "Error message:", showError.message);
        }
        isInitialized = false;
      }
    } catch (error) {
      isInitialized = false;
      error(NAMESPACE, "Crisp initialization failed", error);
      if (error.message) {
        error(NAMESPACE, "Error message:", error.message);
      }
      if (error.stack) {
        error(NAMESPACE, "Error stack:", error.stack);
      }
    }
  },
}));
