import Foundation
import React
import AVFoundation
import UIKit
import CallKit

@objc(CallManager)
class CallManager: RCTEventEmitter, CXCallObserverDelegate {
    // MARK: - Properties
    private var hasListeners = false
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
        audioSession = AVAudioSession.sharedInstance()
        setupAudioSession()
        setupCallObserver()
    }
    
    private func setupAudioSession() {
        do {
            try audioSession?.setCategory(.playAndRecord, mode: .videoChat, options: [.duckOthers, .allowBluetooth, .allowBluetoothA2DP, .allowBluetoothA2DP, .allowAirPlay])
            try audioSession?.setActive(true)
        } catch {
            print("Failed to setup audio session: \(error)")
        }
    }
    
    private func setupCallObserver() {
        callObserver.setDelegate(self, queue: nil)
    }
    
    // MARK: - CXCallObserverDelegate
    func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
        // Определяем состояние звонка
        let callState: String
        
        if call.hasEnded {
            // Звонок завершен
            callState = "disconnected"
        } else if call.isOutgoing && !call.hasConnected {
            // Исходящий звонок
            callState = "dialing"
        } else if !call.isOutgoing && !call.hasConnected && !call.hasEnded {
            // Входящий звонок
            callState = "incoming"
        } else if call.hasConnected && !call.hasEnded {
            // Звонок подключен
            callState = "connected"
        } else {
            // Другое состояние
            callState = "unknown"
        }
        
        // Отправляем событие в React Native
        if hasListeners {
            self.sendEvent(withName: "phoneCallStateChanged", body: [
                "state": callState,
                "callUUID": call.uuid.uuidString
            ])
        }
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
    
    @objc
    override static func moduleName() -> String! {
        return "CallManager"
    }
} 
