import Foundation
import React
import AVFoundation
import UIKit

extension AudioManager {
    // MARK: - Audio Session
    var audioSession: AVAudioSession {
        return AVAudioSession.sharedInstance()
    }
      // Определение групп аудио-устройств
  enum AudioOutputGroup: Int {
    case none = -1
    case earpiece = 0
    case speaker = 1   
    case bluetooth = 2 
    case headphones = 3
    case external = 4  
  }
    
    func setupAudioSession() {
        do {
            try audioSession.setCategory(.playAndRecord, mode: .videoChat, options: [.duckOthers, .allowBluetooth, .allowBluetoothA2DP, .allowBluetoothA2DP, .allowAirPlay])
            try audioSession.setActive(true)
        } catch {
            print("Failed to setup audio session: \(error)")
        }
    }
    
    @objc
    func switchAudioOutput() {
      let currentGroup = getCurrentAudioOutputGroup()
        let nextGroup = (currentGroup.rawValue - 1 < 0) ? AudioOutputGroup.external : AudioOutputGroup(rawValue: currentGroup.rawValue - 1)!
        NLOG("[audioDevices] switchAudioOutput current and next groups", currentGroup, nextGroup)
        
        do {
            switchToRouteGroup(nextGroup)
            try audioSession.setActive(true)
            
            try audioSession.setPreferredOutputNumberOfChannels(2)
            try audioSession.setPreferredIOBufferDuration(0.005)
        } catch {
            print("Error switching audio output: \(error)")
        }
      sendCurrentAudioGroup()
    }


  func getCurrentAudioOutputGroup() -> AudioOutputGroup {
    guard let output = audioSession.currentRoute.outputs.first else {
      return .none
    }
    
    return getGroupByPortType(output.portType)
  }
  
  func getGroupByPortType(_ port: AVAudioSession.Port) -> AudioOutputGroup {
        switch port {
        case .bluetoothA2DP, .bluetoothHFP, .bluetoothLE:
            return .bluetooth
        case .headphones:
            return .headphones
        case .builtInSpeaker:
            return .speaker
        case .builtInReceiver:
            return .earpiece
        case .HDMI, .airPlay, .usbAudio:
            return .external
        default:
          return .none
        }
  }
  
  func switchToRouteGroup(_ group: AudioOutputGroup) {
    if group.rawValue < 0 || group == .none {
      return
    }
    
    do {
      let session = AVAudioSession.sharedInstance()
      
      switch group {
      case AudioOutputGroup.speaker:
        try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
        try session.overrideOutputAudioPort(.speaker)
        return
        
      case AudioOutputGroup.earpiece:
        try session.setCategory(.playAndRecord, mode: .default, options: [])
        try session.overrideOutputAudioPort(.none)
        break
        
      case AudioOutputGroup.bluetooth:
        try session.setCategory(.playAndRecord, mode: .default, options: [.allowBluetooth, .allowBluetoothA2DP])
        break
      case AudioOutputGroup.headphones:
        try session.setCategory(.playAndRecord, mode: .default, options: [])
        break
      case AudioOutputGroup.external:
        try session.setCategory(.playAndRecord, mode: .default, options: [.allowAirPlay])
        break
      case .none:
        return
      }
      let currentGroup = getCurrentAudioOutputGroup()
      if currentGroup != group {
        return switchToRouteGroup(AudioOutputGroup(rawValue: group.rawValue - 1) ?? .none)
      }
    } catch {
        return switchToRouteGroup(AudioOutputGroup(rawValue: group.rawValue - 1) ?? .none)
      }
  }
} 
