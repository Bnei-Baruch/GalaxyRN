import * as React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SettingsDispatcher } from '../settings/SettingsDispatcher'
import Login from '../shared/Login'

const Stack = createNativeStackNavigator()

export const NavApp = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={Login}
                      options={{ title: 'Welcome' }}/>
        {/*<Stack.Screen name="Profile" component={ProfileScreen} />*/}
        <Stack.Screen name="Settings" component={SettingsDispatcher}/>
      </Stack.Navigator>
    </NavigationContainer>
  )
}
