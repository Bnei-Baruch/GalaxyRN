import Foundation
import React

extension AudioManager {
    // MARK: - Properties

    // MARK: - Event Emitter Methods
    @objc
    override func supportedEvents() -> [String]! {
        return [AudioManagerConstants.eventName]
    }
    
    // Override required methods from RCTEventEmitter
    @objc
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    // Method to handle starting observation
    @objc
    override func startObserving() {
        hasListeners = true
    }
    
    // Method to handle stopping observation
    @objc
    override func stopObserving() {
        hasListeners = false
    }
    
    // Event emitter method
    func sendCurrentAudioGroup() {
        if hasListeners {
            let body = getCurrentAudioDevice()
            sendEvent(withName: AudioManagerConstants.eventName, body: body)
        }
    }
  
    private func getCurrentAudioDevice() -> [[String: Any]] {
      var resp: [String: Any] = [:]
      
      let output = audioSession.currentRoute.outputs.first
      let type = getCurrentAudioOutputGroup()
      resp["name"] = output?.uid
      resp["type"] = String(describing: type)
      resp["active"] = true
      NLOG("[audioDevices] getCurrentAudioDevice resp", resp)
      return [resp]
  }
}
