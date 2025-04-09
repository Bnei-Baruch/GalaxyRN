import Foundation
import React
import AVFoundation
import UIKit

// Define NLOG as a global function for logging
func NLOG(_ items: Any...) {
    #if DEBUG
    print(items.map { "\($0)" }.joined(separator: " "))
    #endif
}

@objc(AudioManager)
class AudioManager: RCTEventEmitter {
    // MARK: - Properties
    var hasListeners: Bool = false
    
    // MARK: - Initialization
    override init() {
        super.init()
        setupModules()
        setupAudioSession()
        setupMonitoring()
    }
    
    // MARK: - Setup
    private func setupModules() {
        // Any additional setup can go here
    }
    
    @objc
    override static func moduleName() -> String! {
        return AudioManagerConstants.moduleName
    }
} 
