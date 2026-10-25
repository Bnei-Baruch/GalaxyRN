import Foundation
import React
import UIKit
import WidgetKit

/**
 * Bridge between JS (src/zustand/widget.ts) and the home-screen widget
 * (GalaxyWidget extension) through the shared App Group container: JS pushes
 * the app state, the widget's toggles (AppIntents, run in the extension) are
 * stored as "pending" and announced with a Darwin notification.
 */
@objc(WidgetModule)
class WidgetModule: RCTEventEmitter {
    private static let TAG = "WidgetModule"
    // Keep in sync with GalaxyWidget/GalaxyWidget.swift and both .entitlements
    private static let appGroup = "group.com.galaxy.mobile"
    private static let actionNotification = "com.galaxy.mobile.widgetAction"

    private enum Key {
        static let room = "last_room"
        static let inRoom = "in_room"
        static let micOn = "mic_on"
        static let cammute = "cammute"
        static let audioMode = "audio_mode"
        static let pending = "pending"
    }

    private var hasListeners = false
    private let defaults = UserDefaults(suiteName: WidgetModule.appGroup)

    override init() {
        super.init()
        // A fresh app process is never in a room; drop a stale in-room state
        // left by a killed app
        resetInRoom()
        // Swiped away from the app switcher: JS won't get to push the state
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onTerminate),
            name: UIApplication.willTerminateNotification,
            object: nil
        )
        CFNotificationCenterAddObserver(
            CFNotificationCenterGetDarwinNotifyCenter(),
            Unmanaged.passUnretained(self).toOpaque(),
            { _, observer, _, _, _ in
                guard let observer = observer else { return }
                let module = Unmanaged<WidgetModule>.fromOpaque(observer).takeUnretainedValue()
                module.onWidgetAction()
            },
            WidgetModule.actionNotification as CFString,
            nil,
            .deliverImmediately
        )
    }

    deinit {
        CFNotificationCenterRemoveObserver(
            CFNotificationCenterGetDarwinNotifyCenter(),
            Unmanaged.passUnretained(self).toOpaque(),
            CFNotificationName(WidgetModule.actionNotification as CFString),
            nil
        )
    }

    @objc
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }

    override func supportedEvents() -> [String]! {
        return ["widgetAction"]
    }

    override func startObserving() {
        hasListeners = true
    }

    override func stopObserving() {
        hasListeners = false
    }

    @objc private func onTerminate() {
        GxyLogger.i(WidgetModule.TAG, "app terminating, in room: \(defaults?.bool(forKey: Key.inRoom) == true)")
        resetInRoom()
        // The process is killed right after this returns: flush the App Group
        // write to cfprefsd and let the async WidgetKit reload request go out,
        // otherwise the widget keeps showing "in room"
        defaults?.synchronize()
        Thread.sleep(forTimeInterval: 0.3)
    }

    private func resetInRoom() {
        guard defaults?.bool(forKey: Key.inRoom) == true else { return }
        GxyLogger.d(WidgetModule.TAG, "resetInRoom")
        defaults?.set(false, forKey: Key.inRoom)
        WidgetCenter.shared.reloadAllTimelines()
    }

    private func onWidgetAction() {
        GxyLogger.d(WidgetModule.TAG, "widget action, hasListeners: \(hasListeners)")
        if hasListeners {
            sendEvent(withName: "widgetAction", body: [:])
        }
    }

    @objc
    func setState(_ room: String, isInRoom: Bool, isMicOn: Bool, isCammute: Bool, isAudioMode: Bool) {
        guard let defaults = defaults else {
            GxyLogger.e(WidgetModule.TAG, "App Group \(WidgetModule.appGroup) is not available")
            return
        }
        GxyLogger.d(WidgetModule.TAG, "setState: room: \(room) isInRoom: \(isInRoom) isMicOn: \(isMicOn) isCammute: \(isCammute) isAudioMode: \(isAudioMode)")
        defaults.set(room, forKey: Key.room)
        defaults.set(isInRoom, forKey: Key.inRoom)
        // Don't overwrite toggles JS hasn't consumed yet
        if !defaults.bool(forKey: Key.pending) {
            defaults.set(isMicOn, forKey: Key.micOn)
            defaults.set(isCammute, forKey: Key.cammute)
            defaults.set(isAudioMode, forKey: Key.audioMode)
        }
        WidgetCenter.shared.reloadAllTimelines()
    }

    @objc
    func consumePending(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let defaults = defaults else {
            resolve(["pending": false, "isMicOn": false, "isCammute": true, "isAudioMode": false])
            return
        }
        let result: [String: Bool] = [
            "pending": defaults.bool(forKey: Key.pending),
            "isMicOn": defaults.bool(forKey: Key.micOn),
            "isCammute": defaults.object(forKey: Key.cammute) as? Bool ?? true,
            "isAudioMode": defaults.bool(forKey: Key.audioMode),
        ]
        defaults.set(false, forKey: Key.pending)
        resolve(result)
    }
}
