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
        NLOG("[audioDevices swift] 📢 Sending current audio group to JS")
        if hasListeners {
            let body = getCurrentAudioDevice()
            NLOG("[audioDevices swift] 📢 Emitting event with data:", body)
            sendEvent(withName: AudioManagerConstants.eventName, body: body)
            NLOG("[audioDevices swift] 📢 Event emitted successfully")
        } else {
            NLOG("[audioDevices swift] ⚠️ Not emitting event - no JS listeners registered")
        }
    }
  
    private func getCurrentAudioDevice() -> [[String: Any]] {
      var resp: [String: Any] = [:]
      
      let output = audioSession.currentRoute.outputs.first
      let type = getCurrentAudioOutputGroup()
      resp["name"] = output?.uid
      resp["type"] = String(describing: type)
      resp["active"] = true
      NLOG("[audioDevices swift] getCurrentAudioDevice resp", resp)
      return [resp]
  }
}
