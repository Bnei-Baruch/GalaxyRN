import Foundation
import React
import UIKit

@objc(KeepAwakeModule)
class KeepAwakeModule: NSObject {
    
    @objc
    static func moduleName() -> String! {
        return "KeepAwakeModule"
    }
    
    @objc
    func keepScreenOn() {
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = true
        }
    }
    
    @objc
    func releaseScreenOn() {
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = false
        }
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
} 
