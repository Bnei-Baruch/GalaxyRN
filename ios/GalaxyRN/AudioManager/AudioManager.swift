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
    
    // MARK: - Initialization
    override init() {
        super.init()
        setupMonitoring()
        activateAudioOutput()
    }
    
    // MARK: - Cleanup
    deinit {
        NLOG("[audioDevices swift] AudioManager deinit - cleaning up resources")
        cleanupResources()
    }
    
    // Method to clean up resources
    func cleanupResources() {
        // Remove notification observers
        NotificationCenter.default.removeObserver(self)
        
        // Deactivate audio session to release audio focus
        do {
            try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
            NLOG("[audioDevices swift] Audio session deactivated successfully")
        } catch {
            NLOG("[audioDevices swift] Error deactivating audio session:", error)
        }
    }
    
    // Public method that can be called from React Native
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
