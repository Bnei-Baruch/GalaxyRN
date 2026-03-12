import AVFoundation
import CallKit
import Foundation
import React
import UIKit

@objc(GxyUIStateModule)
class GxyUIStateModule: RCTEventEmitter {
    // MARK: - Properties

    // MARK: - Initialization
    override init() {
        super.init()
    }

    // MARK: - Public Methods

    @objc(startForeground)
    func startForeground() {
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = true
        }
    }

    @objc(stopForeground)
    func stopForeground() {
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = false
        }
    }

    @objc
    override static func moduleName() -> String! {
        return "GxyUIStateModule"
    }
}
