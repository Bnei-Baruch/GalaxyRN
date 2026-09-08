import Foundation
import React

@objc(BackgroundTimer)
class BackgroundTimer: RCTEventEmitter {
    private var hasListeners: Bool = false
    // Tracks the work item + background task behind each still-pending timer so clearTimeout()
    // can actually cancel it - without this, a timer the JS side considers cleared still fires
    // later and sends a "timeout" event into a JS runtime that no longer expects it.
    private var pendingTimeouts: [NSNumber: (workItem: DispatchWorkItem, task: UIBackgroundTaskIdentifier)] = [:]

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

        let workItem = DispatchWorkItem { [weak self] in
            self?.pendingTimeouts.removeValue(forKey: timeoutId)
            if self?.hasListeners == true {
                self?.sendEvent(withName: "timeout", body: timeoutId)
            }
            UIApplication.shared.endBackgroundTask(task)
        }
        pendingTimeouts[timeoutId] = (workItem, task)
        DispatchQueue.main.asyncAfter(deadline: .now() + timeoutMs.doubleValue / 1000, execute: workItem)
    }

    @objc
    func clearTimeout(_ timeoutId: NSNumber) {
        guard let (workItem, task) = pendingTimeouts.removeValue(forKey: timeoutId) else {
            return
        }
        workItem.cancel()
        UIApplication.shared.endBackgroundTask(task)
    }
}
