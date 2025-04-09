import Foundation
import React

extension CallManager {
  // MARK: - Required RCTEventEmitter overrides
  override func supportedEvents() -> [String]! {
    return [CallManagerConstants.eventName]
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
      sendEvent(withName: CallManagerConstants.eventName, body: [
            "state": state,
        ])
    }
  }
}
