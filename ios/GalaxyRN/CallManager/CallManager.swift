import Foundation
import AVFoundation
import CallKit

@objcMembers public class CallManagerImpl: NSObject, CXCallObserverDelegate {
    // MARK: - Properties
    var hasListeners = false
    private var audioSession: AVAudioSession?
    private var isScreenLocked: Bool = false
    private let callObserver = CXCallObserver()
    public weak var eventSender: EventSending?

    // MARK: - Initialization
    public override init() {
        super.init()
        setupModule()
    }

    // MARK: - Setup
    private func setupModule() {
        callObserver.setDelegate(self, queue: nil)
    }

    // MARK: - CXCallObserverDelegate
    public func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
        let callState: String

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
        sendCallState(state: callState)
    }
}
