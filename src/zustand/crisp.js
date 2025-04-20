import { create } from "zustand";
import * as CrispSDK from "react-native-crisp-chat-sdk";
import { CRISP_WEBSITE_ID } from "@env";
import { useUserStore } from "./user";
import { Platform } from "react-native";

let isInitialized = false;
export const useCrispStore = create((set, get) => ({
  start: () => {
    if (isInitialized) {
      try {
        CrispSDK.resetSession();
        console.log("Crisp is already initialized, showing chat window");
        CrispSDK.show();
      } catch (showError) {
        console.error("Crisp show failed", showError);
      }
      return;
    }
    try {
      // Make sure the website ID is in the correct format
      // Remove any quotes, semicolons, and whitespace
      const websiteId = CRISP_WEBSITE_ID.replace(/[";'\s]/g, '');
      const { display, email, id } = useUserStore.getState().user || {};
      console.log("Crisp configuration", websiteId, email, display, id);
      
      if (!websiteId || websiteId.length === 0) {
        throw new Error("Invalid CRISP_WEBSITE_ID");
      }
      
      // Note: For iOS, the SDK may already be configured in AppDelegate.mm
      // For Android, we need to configure it here
      if (Platform.OS === 'android') {
        console.log("Configuring Crisp SDK for Android");
        // First configure the SDK with the website ID
        CrispSDK.configure(websiteId);
      } else {
        console.log("Using pre-configured Crisp SDK for iOS");
      }
      
      // Then set user info only if available
      try {
        if (email) {
          console.log("Setting user email:", email);
          CrispSDK.setUserEmail(email);
        }
        
        if (display) {
          console.log("Setting user nickname:", display);
          CrispSDK.setUserNickname(display);
        }
        
        if (id) {
          // Make sure user ID is also properly formatted
          const cleanId = id.toString().replace(/[";'\s]/g, '');
          console.log("Setting user token ID:", cleanId);
          CrispSDK.setTokenId(cleanId);
        }
      } catch (userInfoError) {
        console.error("Error setting user info:", userInfoError);
        // Continue despite user info errors
      }
      
      try {
        console.log("Attempting to show Crisp chat");
        CrispSDK.show();
        isInitialized = true;
        console.log("Crisp chat initialized successfully");
      } catch (showError) {
        console.error("Crisp show failed with error:", showError);
        if (showError.message) {
          console.error("Error message:", showError.message);
        }
        isInitialized = false;
      }
    } catch (error) {
      isInitialized = false;
      console.error("Crisp initialization failed", error);
      if (error.message) {
        console.error("Error message:", error.message);
      }
      if (error.stack) {
        console.error("Error stack:", error.stack);
      }
    }
  },
}));
