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
    func switchAudioOutput(_ group: Int, callback: @escaping RCTResponseSenderBlock) {
        
        guard let groupEnum = AudioOutputGroup(rawValue: group) else {
            callback([AudioManagerError.invalidDevice.message, NSNull()])
            return
        }
        
        do {
            switchToRouteGroup(groupEnum)
            try audioSession.setActive(true)
            
            try audioSession.setPreferredOutputNumberOfChannels(2)
            try audioSession.setPreferredIOBufferDuration(0.005)
            callback([NSNull(), "Audio output set successfully"])
        } catch {
            callback([AudioManagerError.setOutputFailed.message, NSNull()])
        }
    }

  
  func switchToRouteGroup(_ group: AudioOutputGroup) {
    if group.rawValue < 0 {
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
        return
        
      case AudioOutputGroup.bluetooth:
        try session.setCategory(.playAndRecord, mode: .default, options: [.allowBluetooth, .allowBluetoothA2DP])
        
        let outputs = session.currentRoute.outputs
        if outputs.contains(where: { 
          $0.portType == .bluetoothA2DP || 
          $0.portType == .bluetoothHFP || 
          $0.portType == .bluetoothLE 
        }) {
          return 
        } else {
            return switchToRouteGroup(AudioOutputGroup.earpiece)
        }
      
      case AudioOutputGroup.external:
        try session.setCategory(.playAndRecord, mode: .default, options: [.allowAirPlay])
        
        
        let outputs = session.currentRoute.outputs
        if outputs.contains(where: { $0.portType == .HDMI || $0.portType == .airPlay || $0.portType == .usbAudio }) {
          return 
        } else {
          return switchToRouteGroup(AudioOutputGroup.bluetooth)
        }
      case .headphones:
        try session.setCategory(.playAndRecord, mode: .default, options: [])
        return
      }
    } catch {
        return switchToRouteGroup(AudioOutputGroup(rawValue: group.rawValue - 1) ?? .speaker)
      }
  }
  
} 
