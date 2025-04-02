import Foundation
import React
import AVFoundation
import UIKit

@objc(KeepAwakeModule)
class KeepAwakeModule: NSObject {
    private var bridge: RCTEventEmitter?
    private var isScreenLocked: Bool = false
    
    override init() {
        super.init()
        setupScreenLock()
    }
    
    private func setupScreenLock() {
        UIApplication.shared.isIdleTimerDisabled = true
    }
    
    @objc
    func keepScreenAwake(_ keepAwake: Bool) {
        UIApplication.shared.isIdleTimerDisabled = keepAwake
    }
    
    @objc
    static func moduleName() -> String! {
        return "KeepAwakeModule"
    }
} 