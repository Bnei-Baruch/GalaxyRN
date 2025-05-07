import Foundation
import React

extension AudioManager {
    @objc
    override func constantsToExport() -> [AnyHashable : Any]! {
        return [
            "supportedFeatures": ["audioDeviceMonitoring", "audioDeviceSelection"],
            "eventTypes": [
                "audioDeviceChanged": AudioManagerConstants.audioDeviceChanged,
                "audioRouteChanged": AudioManagerConstants.audioRouteChanged
            ]
        ]
    }
} 
