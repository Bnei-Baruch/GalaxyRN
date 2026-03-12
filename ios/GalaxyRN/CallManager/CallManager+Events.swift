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
  
  func sendCallState(state: String, callUUID: String? = nil, error: String? = nil) {
    if hasListeners {
      var body: [String: Any] = ["state": state]
      if let callUUID = callUUID {
        body["callUUID"] = callUUID
      }
      if let error = error {
        body["error"] = error
      }
      sendEvent(withName: CallManagerConstants.eventName, body: body)
    }
  }
}
