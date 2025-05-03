import Foundation
import React
import AVFoundation
import UIKit

extension AudioManager {
    // MARK: - Audio Monitoring
    
    func setupMonitoring() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleRouteChange),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
    }
    
    
    @objc 
    private func handleRouteChange(notification: Notification) {
        NLOG("[audioDevices] handleRouteChange")
        guard let userInfo = notification.userInfo,
              let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            return
        }
        
        sendCurrentAudioGroup()
    }
    
   @objc
    func handleDevicesChange(_ deviceUID: String) {
        do {
            _ = try activateAudioDevice(withUID: deviceUID)
        } catch {
            NLOG("[audioDevices] Failed to change device: \(error.localizedDescription)")
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
        
        sendCurrentAudioGroup()
    }

} 
