import Foundation
import React
import AVFoundation
import UIKit

@objc(AudioManager)
class AudioManager: NSObject {
    // MARK: - Properties
    internal var bridge: RCTEventEmitter?
    
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
    static func moduleName() -> String! {
        return "AudioManager"
    }
} 