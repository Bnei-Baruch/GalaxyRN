import Foundation
import React

@objc(EventEmitterService)
class EventEmitterService: RCTEventEmitter {
    
    static let shared = EventEmitterService()
    private var registeredEvents: [String] = []
    private var hasListeners = false
    
    override init() {
        super.init()
    }
    
    @objc
    override static func moduleName() -> String! {
        return "EventEmitterService"
    }
    
    @objc
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    func registerEvent(_ eventName: String) {
        if !registeredEvents.contains(eventName) {
            registeredEvents.append(eventName)
        }
    }
    
    override func supportedEvents() -> [String]! {
        return registeredEvents
    }
    
    override func startObserving() {
        hasListeners = true
    }
    
    override func stopObserving() {
        hasListeners = false
    }
    
    // Convenience methods for emitting events
    func emitEvent(name: String, body: Any?) {
        if hasListeners {
            self.sendEvent(withName: name, body: body)
        }
    }
    
    func emitDataUpdate(eventName: String, data: Any) {
        emitEvent(name: eventName, body: data)
    }
} 