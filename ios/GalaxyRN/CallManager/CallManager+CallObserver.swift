import Foundation
import CallKit

extension CallManager: CXCallObserverDelegate {
    // MARK: - CXCallObserverDelegate
    func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
        NLOG("[callManager swift] callObserver callChanged call: \(call)")

        let callState: String
        if call.hasEnded {
            callState = CallEvents.ON_END_CALL.rawValue
        } else {
            // Outgoing/incoming ringing or connected — any live call.
            callState = CallEvents.ON_START_CALL.rawValue
        }

        sendCallState(state: callState, callUUID: call.uuid.uuidString)
    }
}
