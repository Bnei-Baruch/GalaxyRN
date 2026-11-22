import CallKit
import Foundation
import React
import StoreKit

/// Observes system calls (cellular / other VoIP apps) via CXCallObserver and
/// emits onCallStateChanged so JS can leave the room during a call and rejoin
/// after it. Observer-only: the app does not report its own calls to CallKit
/// (no CXProvider), so there is no CallKit call UI.
///
/// CallKit is disabled entirely on the China mainland App Store storefront
/// (MIIT requirement, App Review Guideline 5).
@objc(CallManager)
class CallManager: RCTEventEmitter {
    // MARK: - Properties
    var hasListeners = false

    private var callObserver: CXCallObserver?

    // MARK: - Initialization
    override init() {
        super.init()
        Task { [weak self] in
            guard let self = self else { return }
            if await CallManager.isChinaStorefront() {
                NLOG("[callManager swift] China storefront — CallKit disabled")
                return
            }
            await MainActor.run {
                let observer = CXCallObserver()
                observer.setDelegate(self, queue: nil)
                self.callObserver = observer
            }
        }
    }

    /// True for the China mainland App Store. Falls back to the device region
    /// when the storefront is unavailable, erring on the side of disabling.
    private static func isChinaStorefront() async -> Bool {
        if let storefront = await Storefront.current {
            return storefront.countryCode == "CHN"
        }
        return Locale.current.regionCode == "CN"
    }

    @objc
    override static func moduleName() -> String! {
        return "CallManager"
    }
}
