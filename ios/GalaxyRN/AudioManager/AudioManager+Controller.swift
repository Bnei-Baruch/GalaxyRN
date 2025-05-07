import Foundation
import React
import AVFoundation
import UIKit

extension AudioManager {
  // MARK: - Audio Session
  var audioSession: AVAudioSession {
      return AVAudioSession.sharedInstance()
  }

  // MARK: - Audio Output Groups
  enum AudioOutputGroup: Int {
    case none = -1
    case earpiece = 0
    case speaker = 1   
    case bluetooth = 2 
    case headphones = 3
    case external = 4  
  }
  
  @objc
  func activateAudioOutput() {  
    isSpeakerMode = true    
    NLOG("[audioDevices swift] activateAudioOutput started")
    activateOutputByGroup(.external)
    isSpeakerMode = false
  }
    
  @objc
  func switchAudioOutput() {
    NLOG("[audioDevices swift] 📱 ENTRY: switchAudioOutput method has been called")
    let currentGroup = getCurrentAudioOutputGroup()
    
    NLOG("[audioDevices swift] switchAudioOutput started with currentGroup:", currentGroup)
    
    let nextGroup = (currentGroup.rawValue - 1 < 0) ? AudioOutputGroup.external : AudioOutputGroup(rawValue: currentGroup.rawValue - 1)!
    NLOG("[audioDevices swift] switchAudioOutput current and next groups", currentGroup, nextGroup)
    activateOutputByGroup(nextGroup)
  }

  func activateOutputByGroup(_ group: AudioOutputGroup) {
    do {
        NLOG("[audioDevices swift] Attempting to switch to route group:", group)
        switchToRouteGroup(group)
        
        try audioSession.setActive(true, options: [])
        NLOG("[audioDevices swift] Audio session set active: true")
        
        try audioSession.setPreferredOutputNumberOfChannels(2)
        try audioSession.setPreferredIOBufferDuration(0.005)
        NLOG("[audioDevices swift] Audio session configuration completed")
    } catch {
        NLOG("[audioDevices swift] ❌ ERROR switching audio output:", error)
        print("Error switching audio output: \(error)")
    }
    NLOG("[audioDevices swift] final audio group after switching:", getCurrentAudioOutputGroup())
    NLOG("[audioDevices swift] 📱 EXIT: switchAudioOutput completed")
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
      NLOG("[audioDevices swift] 🚫 Skipping invalid route group:", group)
      return
    }
    
    do {
      let session = AVAudioSession.sharedInstance()
      NLOG("[audioDevices swift] 🔄 Attempting to switch to route group:", group)
      
      switch group {
      case AudioOutputGroup.speaker:
        NLOG("[audioDevices swift] 🔊 Setting up speaker mode")
        try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetooth, .mixWithOthers])
        try session.overrideOutputAudioPort(.speaker)
        try session.setPreferredInput(nil)
        NLOG("[audioDevices swift] ✅ Speaker mode configured")
        break
        
      case AudioOutputGroup.earpiece:
        NLOG("[audioDevices swift] 👂 Setting up earpiece mode")
        try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.mixWithOthers])
        try session.overrideOutputAudioPort(.none)
        // Поиск и установка встроенного микрофона
        if let builtInMic = findInputPortOfType(.builtInMic) {
          try session.setPreferredInput(builtInMic)
        }
        NLOG("[audioDevices swift] ✅ Earpiece mode configured")
        break
        
      case AudioOutputGroup.bluetooth:
        NLOG("[audioDevices swift] 🎧 Setting up bluetooth mode")
        try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth, .allowBluetoothA2DP, .mixWithOthers])
      
        if let bluetoothInput = findBluetoothInput() {
          try session.setPreferredInput(bluetoothInput)
        }
        NLOG("[audioDevices swift] ✅ Bluetooth mode configured")
        break
        
      case AudioOutputGroup.headphones:
        NLOG("[audioDevices swift] 🎧 Setting up headphones mode")
        try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.mixWithOthers])
        try session.overrideOutputAudioPort(.none)
        
        if let headsetMic = findInputPortOfType(.headsetMic) {
          try session.setPreferredInput(headsetMic)
        }
        NLOG("[audioDevices swift] ✅ Headphones mode configured")
        break
        
      case AudioOutputGroup.external:
        NLOG("[audioDevices swift] 📺 Setting up external device mode")
        try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowAirPlay, .mixWithOthers])
        NLOG("[audioDevices swift] ✅ External device mode configured")
        break
        
      case .none:
        NLOG("[audioDevices swift] 🚫 None mode selected, returning")
        return
      }
      
      let currentGroup = getCurrentAudioOutputGroup()
      NLOG("[audioDevices swift] 🔍 After configuration - current group:", currentGroup, "target group:", group)

      
      
      if currentGroup != group && !(currentGroup == .none && group == .earpiece) {
        NLOG("[audioDevices swift] ↩️ Target not achieved, falling back to previous group:", AudioOutputGroup(rawValue: group.rawValue - 1) ?? .none)
        return switchToRouteGroup(AudioOutputGroup(rawValue: group.rawValue - 1) ?? .none)
      } else {
        NLOG("[audioDevices swift] ✅ Successfully switched to target group:", group)
      }
    } catch {
        NLOG("[audioDevices swift] ❌ ERROR configuring route group:", group, "error:", error)
        NLOG("[audioDevices swift] ↩️ Falling back to previous group:", AudioOutputGroup(rawValue: group.rawValue - 1) ?? .none)
        return switchToRouteGroup(AudioOutputGroup(rawValue: group.rawValue - 1) ?? .none)
    }
  }
  
  private func findBluetoothInput() -> AVAudioSessionPortDescription? {
    let inputs = audioSession.availableInputs
    for input in inputs ?? [] {
      if input.portType == .bluetoothHFP || input.portType == .bluetoothA2DP || input.portType == .bluetoothLE {
        return input
      }
    }
    return nil
  }
  
  private func findInputPortOfType(_ portType: AVAudioSession.Port) -> AVAudioSessionPortDescription? {
    let inputs = audioSession.availableInputs
    for input in inputs ?? [] {
      if input.portType == portType {
        return input
      }
    }
    return nil
  }
} 
