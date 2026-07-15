import Foundation

extension CallManagerImpl {
  // MARK: - Listener Lifecycle
  public func startObserving() {
      hasListeners = true
  }

  public func stopObserving() {
      hasListeners = false
  }

  func sendCallState(state: String) {
    if hasListeners {
      eventSender?.sendEvent(withName: CallManagerConstants.eventName, body: ["state": state])
    }
  }
}
