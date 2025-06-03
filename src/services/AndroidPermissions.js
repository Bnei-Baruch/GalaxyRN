import React, { useEffect } from "react";
import WIP from "../components/WIP";
import { Platform } from "react-native";
import { useAndroidPermissionsStore } from "../zustand/androidPermissions";
import { debug } from './logger';

const isAndroid = Platform.OS === "android";

const NAMESPACE = 'AndroidPermissions';

const AndroidPermissions = ({ children }) => {
  const {
    permissionsReady,
    initAndroidPermissions,
    terminateAndroidPermissions,
  } = useAndroidPermissionsStore();

  debug(NAMESPACE, "AndroidPermissions permissionsReady: ", permissionsReady);

  useEffect(() => {
    if (!isAndroid) {
      return;
    }

    initAndroidPermissions();

    return () => {
      terminateAndroidPermissions();
    };
  }, []);

  if (!isAndroid) {
    return children;
  }

  return <WIP isReady={permissionsReady}>{children}</WIP>;
};

export default AndroidPermissions;
