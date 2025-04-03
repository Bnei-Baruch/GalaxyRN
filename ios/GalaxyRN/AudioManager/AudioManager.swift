import Foundation
import React
import AVFoundation
import UIKit

@objc(AudioManager)
class AudioManager: RCTEventEmitter {
    // MARK: - Properties
    private var hasListeners = false
    
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
    
    // MARK: - Listener Lifecycle
    override func startObserving() {
        hasListeners = true
    }
    
    override func stopObserving() {
        hasListeners = false
    }
} 
