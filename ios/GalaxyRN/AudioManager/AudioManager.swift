import Foundation
import React
import AVFoundation
import UIKit

@objc(AudioManager)
class AudioManager: NSObject, RCTBridgeModule {
    // MARK: - Properties
    
    // MARK: - Initialization
    override init() {
        super.init()
        setupModules()
        setupAudioSession()
        setupMonitoring()
        
        // Register events with EventEmitterService
        EventEmitterService.shared.registerEvent(AudioManagerConstants.eventName)
    }
    
    // MARK: - Setup
    private func setupModules() {
        // Any additional setup can go here
    }
    
    @objc
    static func moduleName() -> String! {
        return AudioManagerConstants.moduleName
    }
} 
