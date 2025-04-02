import Foundation
import React
import AVFoundation
import UIKit

@objc(AudioManager)
class AudioManager: NSObject {
    // MARK: - Properties
    private var monitor: AudioDeviceMonitor?
    private var controller: AudioDeviceController?
    
    // MARK: - Initialization
    override init() {
        super.init()
        setupModules()
    }
    
    // MARK: - Setup
    private func setupModules() {
        monitor = AudioDeviceMonitor()
        controller = AudioDeviceController()
    }
    
    @objc
    func getAvailableAudioDevices(_ callback: @escaping RCTResponseSenderBlock) {
        monitor?.getAvailableAudioDevices(callback)
    }
    
    @objc
    func setAudioOutput(_ deviceType: String, callback: @escaping RCTResponseSenderBlock) {
        controller?.setAudioOutput(deviceType, callback: callback)
    }
    
    @objc
    static func moduleName() -> String! {
        return "AudioManager"
    }
} 