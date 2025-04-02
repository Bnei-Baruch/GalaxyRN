import Foundation
import React

extension AudioManager {
    // MARK: - Event Handling
    func sendEvent(name: String, body: Any?) {
        bridge?.sendEvent(withName: name, body: body)
    }
    
    // MARK: - Event Methods
    @objc
    func emitDataUpdate(_ data: Any) {
        sendEvent(name: Constants.eventName, body: data)
    }
} 