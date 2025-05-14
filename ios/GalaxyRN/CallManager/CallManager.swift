import Foundation
import AVFoundation
import CallKit
import React
import UIKit

@objc(CallManager)
class CallManager: RCTEventEmitter, CXCallObserverDelegate {
    // MARK: - Properties
    var hasListeners = false
    private var audioSession: AVAudioSession?
    private var isScreenLocked: Bool = false
    private let callObserver = CXCallObserver()
    
    // MARK: - Initialization
    override init() {
        super.init()
        setupModule()
    }
    
    // MARK: - Setup
    private func setupModule() {
        callObserver.setDelegate(self, queue: nil)
    }
    
    // MARK: - CXCallObserverDelegate
    func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
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
    
    // MARK: - Public Methods
    @objc
    func keepScreenAwake(_ keepAwake: Bool) {
        UIApplication.shared.isIdleTimerDisabled = keepAwake
    }
    
    @objc
    override static func moduleName() -> String! {
        return "CallManager"
    }
} 
