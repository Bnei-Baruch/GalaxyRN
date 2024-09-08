import React, { useEffect, useRef } from 'react'
import defaultDevices from '../shared/devices'
import { useSettingsStore } from '../zustand/settings'
import { Text } from 'react-native'
import styles from './VideoStyle'
import { useUserStore } from '../zustand/user'
import Icon from 'react-native-vector-icons/MaterialIcons'

const MyMedia = (props) => {
  const { name } = useUserStore()
  const { joined, muted, cammuted, question } = useSettingsStore()
  const device = defaultDevices?.[0]
  const { setting: { height, width } = {}, stream } = device || {}
  const videoRef = useRef()

  useEffect(() => {
    stream && videoRef?.current && (videoRef.current.srcObject = stream)
  }, [stream, videoRef])

  if (!device) return <Text>No device</Text>

  return (
    <div style={styles.container}>
      <div style={styles.container}>
        <div style={styles.container}>
          {muted
            ? <Icon name="microphone slash" size="small" color="red"/>
            : ''}
          {name}
          <Icon style={{ marginLeft: '0.3rem' }} name="signal" size="small"/>
        </div>
      </div>
      <video
        ref={videoRef}
        id="localVideo"
        autoPlay={true}
        controls={false}
        muted={true}
        playsInline={true}
        style={{ width: '100%' }}
      />
    </div>
  )
}
export default MyMedia
