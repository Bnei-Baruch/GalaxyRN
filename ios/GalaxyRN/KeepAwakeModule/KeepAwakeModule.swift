import Foundation
import UIKit

@objcMembers public class KeepAwakeModuleImpl: NSObject {

    public func keepScreenOn() {
        NLOG("[keepAwake swift] keepScreenOn called")
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = true
        }
    }

    public func releaseScreenOn() {
        NLOG("[keepAwake swift] releaseScreenOn called")
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = false
        }
    }
}
