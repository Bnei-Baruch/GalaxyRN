import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import login from '../shared/login';

const Stack = createNativeStackNavigator();

export const NavApp = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={login} options={{title: 'Welcome'}} />
        {/*<Stack.Screen name="Profile" component={ProfileScreen} />*/}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
