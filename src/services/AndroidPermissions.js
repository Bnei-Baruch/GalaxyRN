import React, { useEffect } from "react";
import WIP from "../components/WIP";
import { Platform } from "react-native";
import { useAndroidPermissionsStore } from "../zustand/androidPermissions";
import logger from './logger';

const isAndroid = Platform.OS === "android";

const NAMESPACE = 'AndroidPermissions';

const AndroidPermissions = ({ children }) => {
  const {
    permissionsReady,
    initPermissions,
    terminatePermissions,
  } = useAndroidPermissionsStore();

  logger.debug(NAMESPACE, "AndroidPermissions permissionsReady: ", permissionsReady);

  useEffect(() => {
    if (!isAndroid) {
      return;
    }

    initPermissions();

    return () => {
      terminatePermissions();
    };
  }, []);

  if (!isAndroid) {
    return children;
  }

  return <WIP isReady={permissionsReady}>{children}</WIP>;
};

export default AndroidPermissions;
