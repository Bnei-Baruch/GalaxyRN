import Foundation
import React
import AVFoundation
import UIKit

extension AudioManager {
    // MARK: - Audio Monitoring
    
    func setupMonitoring() {
        setupNotifications()
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
        
        let body = getAvailableAudioDevices()
        
      sendEvent(name: AudioManagerConstants.eventName, body: body)
    }
    
   @objc
    func handleDevicesChange(_ deviceUID: String, callback: @escaping RCTResponseSenderBlock) {
        do {
            let resp = try activateAudioDevice(withUID: deviceUID)
            callback([NSNull(), resp])
        } catch {
            callback([["error": error.localizedDescription], NSNull()])
        }
    }

    func activateAudioDevice(withUID deviceUID: String) throws {
        let session = AVAudioSession.sharedInstance()
        
        guard let portDescription = session.availableInputs?.first(where: { $0.uid == deviceUID }) else {
            throw NSError(domain: "AudioManager", code: 404, userInfo: [NSLocalizedDescriptionKey: "Audio device not found"])
        }
        
        try session.setPreferredInput(portDescription)
        
        let currentRoute = session.currentRoute
        if currentRoute.outputs.first(where: { $0.uid == deviceUID }) != nil {
            try session.setCategory(.playAndRecord, options: [.allowBluetooth, .allowBluetoothA2DP])
            try session.setActive(true, options: .notifyOthersOnDeactivation)
        }
        
        // Notify about the route change
        let body = getAvailableAudioDevices()
      sendEvent(name: AudioManagerConstants.eventName, body: body)
    }

    func getAvailableAudioDevices() -> [[String: Any]] {
        var devices: [[String: Any]] = []
        

        for output in audioSession.currentRoute.outputs {
            let deviceType = AudioDeviceType.from(port: output.portType)
            if Self.isDeviceTypeSupported(deviceType) {
                devices.append([
                  "id": output.uid,
                  "type": output.portType,
                ])
            }
        }
        
        return devices
    }
} 
