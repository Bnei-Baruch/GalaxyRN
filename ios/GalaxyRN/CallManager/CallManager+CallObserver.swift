import Foundation
import CallKit

extension CallManager: CXCallObserverDelegate {
    // MARK: - CXCallObserverDelegate
    func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
      if call.uuid == self.uuid {
            NLOG("[callManager swift] callObserver callChanged call: \(call) is the current call")
            return
        }

        let callState: String
        NLOG("[callManager swift] callObserver callChanged call: \(call)")

        if call.hasEnded {
            callState = CallEvents.ON_END_CALL.rawValue
        } else if call.isOutgoing && !call.hasConnected {
            callState = CallEvents.ON_START_CALL.rawValue
        } else if !call.isOutgoing && !call.hasConnected && !call.hasEnded {
            callState = CallEvents.ON_START_CALL.rawValue
        } else if call.hasConnected && !call.hasEnded {
            callState = CallEvents.ON_START_CALL.rawValue
        } else {
            callState = CallEvents.OTHERS.rawValue
        }

        sendCallState(state: callState, callUUID: call.uuid.uuidString)
    }
}
