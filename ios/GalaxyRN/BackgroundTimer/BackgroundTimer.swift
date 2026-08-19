import Foundation
import React

@objc(BackgroundTimer)
class BackgroundTimer: RCTEventEmitter {
    private var hasListeners: Bool = false

    @objc
    override static func moduleName() -> String! {
        return "BackgroundTimer"
    }

    @objc
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc
    override func supportedEvents() -> [String]! {
        return ["timeout"]
    }

    @objc
    override func startObserving() {
        hasListeners = true
    }

    @objc
    override func stopObserving() {
        hasListeners = false
    }

    @objc
    func setTimeout(_ timeoutId: NSNumber, timeoutMs: NSNumber) {
        var task: UIBackgroundTaskIdentifier = .invalid
        task = UIApplication.shared.beginBackgroundTask(withName: "BackgroundTimer") {
            UIApplication.shared.endBackgroundTask(task)
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + timeoutMs.doubleValue / 1000) { [weak self] in
            if self?.hasListeners == true {
                self?.sendEvent(withName: "timeout", body: timeoutId)
            }
            UIApplication.shared.endBackgroundTask(task)
        }
    }
}
