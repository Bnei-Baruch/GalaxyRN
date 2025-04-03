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
    func keepAwake(_ enabled: Bool) {
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = enabled
        }
    }
    
    @objc
    func getCurrentState(_ callback: RCTResponseSenderBlock) {
        let isAwake = UIApplication.shared.isIdleTimerDisabled
        callback([NSNull(), isAwake])
    }
} 