import AVFoundation
import CallKit
import Foundation
import React
import UIKit

@objc(CallManager)
class CallManager: RCTEventEmitter {
    // MARK: - Properties
    var hasListeners = false
    var audioSession: AVAudioSession?
    var uuid: UUID = UUID()

    private var isScreenLocked: Bool = false
    private let callObserver = CXCallObserver()
    private let callController = CXCallController()
    private var provider: CXProvider?

    // MARK: - Initialization
    override init() {
        super.init()
        setupModule()
    }

    // MARK: - Setup
    private func setupModule() {
        callObserver.setDelegate(self, queue: nil)

        let configuration = CXProviderConfiguration(localizedName: "Galaxy")
        configuration.supportsVideo = true
        configuration.supportedHandleTypes = [.generic]

        let callProvider = CXProvider(configuration: configuration)
        callProvider.setDelegate(self, queue: nil)
        provider = callProvider
    }

    // MARK: - Public Methods

    @objc(startCall:)
    func startCall(handle: String) {
        Task {
            let cxHandle = CXHandle(type: .generic, value: handle)
            let action = CXStartCallAction(call: uuid, handle: cxHandle)
            let transaction = CXTransaction(action: action)

            do {
                try await callController.request(transaction)
            } catch {
                NLOG("[callManager swift] startCall error: \(error)")
            }
        }
    }

    @objc
    func endCall() {
        Task {
            let action = CXEndCallAction(call: uuid)
            let transaction = CXTransaction(action: action)

            do {
                try await callController.request(transaction)
            } catch {
                NLOG("[callManager swift] endCall error: \(error)")
            }
        }
    }

    @objc
    override static func moduleName() -> String! {
        return "CallManager"
    }
}
