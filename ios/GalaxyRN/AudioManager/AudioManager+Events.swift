import Foundation
import React

extension AudioManager {
    // MARK: - Event Methods
    @objc
    func emitDataUpdate(_ data: Any) {
        EventEmitterService.shared.emitDataUpdate(eventName: AudioManagerConstants.eventName, data: data)
    }
} 
