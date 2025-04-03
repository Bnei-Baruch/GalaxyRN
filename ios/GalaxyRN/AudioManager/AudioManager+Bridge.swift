import Foundation
import React

extension AudioManager {
    @objc
  override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
  override func constantsToExport() -> [AnyHashable : Any]! {
        return [
            "version": "1.0.0",
            "supportedFeatures": ["audioDeviceMonitoring", "audioDeviceSelection"],
            "eventTypes": [
                "audioDeviceChanged": AudioManagerConstants.audioDeviceChanged,
                "audioRouteChanged": AudioManagerConstants.audioRouteChanged
            ],
            "deviceTypes": [
                "builtInSpeaker": AudioDeviceType.builtInSpeaker.rawValue,
                "builtInReceiver": AudioDeviceType.builtInReceiver.rawValue,
                "builtInMic": AudioDeviceType.builtInMic.rawValue,
                
                "headphone": AudioDeviceType.headphone.rawValue,
                "headsetMic": AudioDeviceType.headsetMic.rawValue,
                
                "bluetoothA2DP": AudioDeviceType.bluetoothA2DP.rawValue,
                "bluetoothHFP": AudioDeviceType.bluetoothHFP.rawValue,
                "bluetoothLE": AudioDeviceType.bluetoothLE.rawValue,
                
                "airPlay": AudioDeviceType.airPlay.rawValue,
                
                "externalSpeaker": AudioDeviceType.externalSpeaker.rawValue,
                "externalMic": AudioDeviceType.externalMic.rawValue,
                "externalAudio": AudioDeviceType.externalAudio.rawValue,
                
                "carAudio": AudioDeviceType.carAudio.rawValue,
                "usbAudio": AudioDeviceType.usbAudio.rawValue
            ],
            "deviceDescriptions": [
                AudioDeviceType.builtInSpeaker.rawValue: AudioDeviceType.builtInSpeaker.description,
                AudioDeviceType.builtInReceiver.rawValue: AudioDeviceType.builtInReceiver.description,
                AudioDeviceType.builtInMic.rawValue: AudioDeviceType.builtInMic.description,
                AudioDeviceType.headphone.rawValue: AudioDeviceType.headphone.description,
                AudioDeviceType.headsetMic.rawValue: AudioDeviceType.headsetMic.description,
                AudioDeviceType.bluetoothA2DP.rawValue: AudioDeviceType.bluetoothA2DP.description,
                AudioDeviceType.bluetoothHFP.rawValue: AudioDeviceType.bluetoothHFP.description,
                AudioDeviceType.bluetoothLE.rawValue: AudioDeviceType.bluetoothLE.description,
                AudioDeviceType.airPlay.rawValue: AudioDeviceType.airPlay.description,
                AudioDeviceType.externalSpeaker.rawValue: AudioDeviceType.externalSpeaker.description,
                AudioDeviceType.externalMic.rawValue: AudioDeviceType.externalMic.description,
                AudioDeviceType.externalAudio.rawValue: AudioDeviceType.externalAudio.description,
                AudioDeviceType.carAudio.rawValue: AudioDeviceType.carAudio.description,
                AudioDeviceType.usbAudio.rawValue: AudioDeviceType.usbAudio.description
            ],
            "minimumIOSVersions": [
                AudioDeviceType.bluetoothLE.rawValue: AudioDeviceType.bluetoothLE.minimumIOSVersion,
                AudioDeviceType.usbAudio.rawValue: AudioDeviceType.usbAudio.minimumIOSVersion,
                AudioDeviceType.carAudio.rawValue: AudioDeviceType.carAudio.minimumIOSVersion
            ]
        ]
    }
    
    @objc
  override func supportedEvents() -> [String]! {
        return [AudioManagerConstants.eventName]
    }
} 
