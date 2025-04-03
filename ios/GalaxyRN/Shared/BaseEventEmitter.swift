import Foundation
import React

class BaseEventEmitter: RCTEventEmitter {
    // MARK: - Static Methods
    static func emitEvent(from emitter: RCTEventEmitter, name: String, body: Any?) {
        emitter.sendEvent(withName: name, body: body)
    }
    
    static func emitDataUpdate(from emitter: RCTEventEmitter, eventName: String, data: Any) {
        emitEvent(from: emitter, name: eventName, body: data)
    }
    
    // MARK: - Required Overrides
    override func supportedEvents() -> [String]! {
        return []
    }
} 