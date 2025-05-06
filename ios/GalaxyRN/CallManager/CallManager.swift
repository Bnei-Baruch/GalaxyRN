import Foundation
import React
import AVFoundation
import UIKit
import CallKit

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
    
    private func setupAudioSession() {
        do {
            try audioSession?.setCategory(.playAndRecord, mode: .videoChat, options: [.duckOthers, .allowBluetooth, .allowBluetoothA2DP, .allowBluetoothA2DP, .allowAirPlay])
            try audioSession?.setActive(true)
        } catch {
            print("Failed to setup audio session: \(error)")
        }
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
    func enableBackgroundPlayback() {
        setupAudioSession()
    }
    
    @objc
    func disableBackgroundPlayback() {
        do {
            try audioSession?.setActive(false)
        } catch {
            print("Failed to deactivate audio session: \(error)")
        }
    }
    
    @objc
    func keepScreenAwake(_ keepAwake: Bool) {
        UIApplication.shared.isIdleTimerDisabled = keepAwake
    }
    
    @objc
    override static func moduleName() -> String! {
        return "CallManager"
    }
} 
