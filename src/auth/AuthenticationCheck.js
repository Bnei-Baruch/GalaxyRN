import React, { useEffect } from 'react';

import { View } from 'react-native';
import BeforeRoom from '../InRoom/BeforeRoom';
import RoomInit from '../InRoom/RoomInit';
import ScreenOrientation from '../InRoom/ScreenOrientation';
import WIP from '../components/WIP';
import { baseStyles } from '../constants';
import UserPermissions from '../services/UserPermissions';
import logger from '../services/logger';
import { useUserStore } from '../zustand/user';
import LoginScreen from './LoginScreen';
import kc from './keycloak';

const NAMESPACE = 'CheckAuthentication';

const AuthenticationCheck = () => {
  const hasUser = useUserStore(state =>
    state.user === undefined ? null : !!state.user
  );
  const vhinfo = useUserStore(state => state.vhinfo);

  logger.debug(NAMESPACE, 'render', hasUser);

  useEffect(() => {
    kc.startFromStorage();
    return () => kc.clearTimeout();
  }, []);

  if (hasUser === null) {
    return <WIP isReady={false} />;
  }

  if (!hasUser) {
    return <LoginScreen />;
  }

  if (!vhinfo?.active) {
    return (
      <WIP isReady={!!vhinfo}>
        <UserPermissions />
      </WIP>
    );
  }

  return (
    <View style={baseStyles.full}>
      <BeforeRoom />
      <RoomInit />
      <ScreenOrientation />
    </View>
  );
};

export default AuthenticationCheck;
