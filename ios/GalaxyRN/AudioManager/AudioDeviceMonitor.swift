import Foundation
import React
import AVFoundation
import UIKit

@objc(AudioDeviceMonitor)
class AudioDeviceMonitor: NSObject {
    private var bridge: RCTEventEmitter?
    private var audioSession: AVAudioSession?
    
    override init() {
        super.init()
        setupAudioSession()
        setupNotifications()
    }
    
    
    private func setupAudioSession() {
        audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession?.setCategory(.playAndRecord, mode: .videoChat, options: [.duckOthers, .allowBluetooth, .allowBluetoothA2DP, .allowBluetoothA2DP, .allowAirPlay])
            try audioSession?.setActive(true)
        } catch {
            print("Failed to setup audio session: \(error)")
        }
    }
    
    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleRouteChange),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
    }
    
    @objc 
    private func handleRouteChange(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            return
        }
        
        let currentRoute = audioSession?.currentRoute
        let output = currentRoute?.outputs.first
        let deviceType = AudioDeviceType.from(port: output?.portType ?? .unknown)
        
        let eventData: [String: Any] = [
            "type": Constants.audioDeviceChanged,
            "deviceType": deviceType.rawValue,
            "deviceName": output?.portName ?? "Unknown",
            "reason": reason.rawValue
        ]
        
        sendEvent(name: Constants.eventName, body: eventData)
    }
    
    @objc
    func getAvailableAudioDevices(_ callback: @escaping RCTResponseSenderBlock) {
        guard Self.isIOSVersionSupported() else {
            callback([AudioManagerError.unsupportedIOSVersion.message, NSNull()])
            return
        }
        
        guard let availableInputs = audioSession?.availableInputs,
              let currentRoute = audioSession?.currentRoute else {
            callback([AudioManagerError.noDeviceAvailable.message, NSNull()])
            return
        }
        
        var devices: [[String: Any]] = []
        
        if let currentOutput = currentRoute.outputs.first {
            let currentDeviceType = AudioDeviceType.from(port: currentOutput.portType)
            devices.append([
                "type": currentDeviceType.rawValue,
                "name": currentOutput.portName,
                "isCurrent": true
            ])
        }
        
        for input in availableInputs {
            let deviceType = AudioDeviceType.from(port: input.portType)
            if Self.isDeviceTypeSupported(deviceType) {
                devices.append([
                    "type": deviceType.rawValue,
                    "name": input.portName,
                    "isCurrent": false
                ])
            }
        }
        
        callback([NSNull(), devices])
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}