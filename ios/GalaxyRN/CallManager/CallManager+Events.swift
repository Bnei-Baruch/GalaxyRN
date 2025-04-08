import Foundation
import React

extension CallManager {
  // MARK: - Required RCTEventEmitter overrides
  override func supportedEvents() -> [String]! {
      return ["phoneCallStateChanged"]
  }
  
  // MARK: - Listener Lifecycle
  override func startObserving() {
      hasListeners = true
  }
  
  override func stopObserving() {
      hasListeners = false
  }
  
  func sendCallState( state: String ){
    if hasListeners {
        sendEvent(withName: "phoneCallStateChanged", body: [
            "state": state,
        ])
    }
  }
}
