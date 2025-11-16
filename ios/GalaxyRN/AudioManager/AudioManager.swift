import Foundation
import AVFoundation
import React

// Define NLOG as a global function for logging
func NLOG(_ items: Any...) {
    print(items.map { "\($0)" }.joined(separator: " "))
}

@objc(AudioManager)
class AudioManager: RCTEventEmitter {
    // MARK: - Properties
    var hasListeners: Bool = false
    var isSpeakerMode: Bool = false
    var isMonitoringSetup: Bool = false
    
    // MARK: - Initialization
    override init() {
        super.init()
        NLOG("[audioDevices swift] AudioManager init")
        setupMonitoring()
        activateAudioOutput()
    }
    
    // MARK: - Cleanup
    deinit {
        NLOG("[audioDevices swift] AudioManager deinit - cleaning up resources")
        cleanupResources()
    }
    
    func cleanupResources() {
        NLOG("[audioDevices swift] cleanupResources called")
        
        NotificationCenter.default.removeObserver(self)
        
        safeDeactivateAudioSession()
    }
    
    private func safeDeactivateAudioSession() {
        let session = AVAudioSession.sharedInstance()
        
        do {
            try session.setActive(false, options: .notifyOthersOnDeactivation)
            NLOG("[audioDevices swift] ✅ Audio session deactivated successfully")
        } catch let error as NSError {
            if error.domain == "NSOSStatusErrorDomain" && error.code == 560030580 {
                NLOG("[audioDevices swift] ⚠️ Cannot deactivate audio session: active I/O operations detected")
                
                do {
                    try session.setActive(false, options: [])
                    NLOG("[audioDevices swift] ✅ Audio session deactivated without notification")
                } catch {
                    NLOG("[audioDevices swift] ⚠️ Audio session deactivation failed (expected with active I/O):", error.localizedDescription)
                    // Ensure session remains active since we couldn't deactivate it
                    do {
                        try session.setActive(true, options: [])
                        NLOG("[audioDevices swift] ✅ Audio session kept active after failed deactivation")
                    } catch {
                        NLOG("[audioDevices swift] ⚠️ Could not ensure session is active:", error.localizedDescription)
                    }
                }
            } else {
                NLOG("[audioDevices swift] ❌ Error deactivating audio session:", error.localizedDescription)
            }
        } catch {
            NLOG("[audioDevices swift] ❌ Unexpected error deactivating audio session:", error)
        }
    }
    
    @objc
    func releaseAudioFocus() {
        NLOG("[audioDevices swift] releaseAudioFocus called from React Native")
        cleanupResources()
    }
    
    @objc
    override static func moduleName() -> String! {
        return AudioManagerConstants.moduleName
    }
} 
