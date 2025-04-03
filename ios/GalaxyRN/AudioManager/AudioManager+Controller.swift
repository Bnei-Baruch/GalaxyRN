import Foundation
import React
import AVFoundation
import UIKit

extension AudioManager {
    // MARK: - Audio Session
    var audioSession: AVAudioSession {
        return AVAudioSession.sharedInstance()
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
    func setAudioOutput(_ deviceType: String, callback: @escaping RCTResponseSenderBlock) {
        guard Self.isIOSVersionSupported() else {
            callback([AudioManagerError.unsupportedIOSVersion.message, NSNull()])
            return
        }
        
        guard let deviceTypeEnum = AudioDeviceType(rawValue: deviceType) else {
            callback([AudioManagerError.invalidDevice.message, NSNull()])
            return
        }
        
        guard Self.isDeviceTypeSupported(deviceTypeEnum) else {
            callback([AudioManagerError.unsupportedIOSVersion.message, NSNull()])
            return
        }
        
        do {
            try audioSession.setCategory(.playAndRecord, mode: .default)
            try audioSession.setActive(true)
            
            try audioSession.setPreferredOutputNumberOfChannels(2)
            try audioSession.setPreferredIOBufferDuration(0.005)
            
            try audioSession.setPreferredInput(audioSession.availableInputs?.first { input in
                input.portType == deviceTypeEnum.portType
            })
          /*
            try audioSession.setPreferredOutput(audioSession.availableOutputs?.first { output in
                output.portType == deviceTypeEnum.portType
            })
            */
            callback([NSNull(), "Audio output set successfully"])
        } catch {
            callback([AudioManagerError.setOutputFailed.message, NSNull()])
        }
    }
} 
