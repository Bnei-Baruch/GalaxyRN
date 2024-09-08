import React from 'react'
import log from 'loglevel'
import Login from './src/shared/Login'
import { SettingsDispatcher } from './src/settings/SettingsDispatcher'
import { useSettingsStore } from './src/zustand/settings'
import InRoom from './src/InRoom/InRoom'

log.setLevel('debug')

const App = () => {

  const { joined } = useSettingsStore()
  return (
    <Login>
      {joined ? <InRoom/> : <SettingsDispatcher/>}
    </Login>
  )
}
export default App