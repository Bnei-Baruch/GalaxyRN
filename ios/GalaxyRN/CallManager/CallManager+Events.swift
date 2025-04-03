import Foundation
import React

extension CallManager {
    // MARK: - Event Methods
    @objc
    func emitDataUpdate(_ data: Any) {
        EventEmitterService.shared.emitDataUpdate(eventName: Constants.eventName, data: data)
    }
} 
