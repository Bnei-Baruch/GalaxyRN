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
  
  // Method required by NativeEventEmitter
  @objc
  override func addListener(_ eventName: String) {
      // Keep track of listeners if needed
      print("[calls swift] addListener called for event:", eventName)
  }
  
  // Method required by NativeEventEmitter
  @objc
  override func removeListeners(_ count: Double) {
      // Remove listeners if needed
      print("[calls swift] removeListeners called, count:", count)
  }
  
  func sendCallState(state: String) {
    if hasListeners {
      sendEvent(withName: CallManagerConstants.eventName, body: [
            "state": state,
        ])
    }
  }
}
