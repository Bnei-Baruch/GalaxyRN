import * as React from 'react'
import { SettingsNotJoined } from './SettingsNotJoined'
import { SettingsJoined } from './SettingsJoined'
import { useSettingsStore } from '../zustand/settings'

export const SettingsDispatcher = ({ room = false }) => {
  /*const { joined } = useSettingsStore()
  if (joined)
    return <SettingsJoined/>*/
  return <SettingsNotJoined/>
}
