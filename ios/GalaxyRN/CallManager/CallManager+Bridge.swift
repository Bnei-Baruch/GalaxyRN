import Foundation
import React

extension CallManager {
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
    func constantsToExport() -> [AnyHashable : Any]! {
        return [
            "version": "1.0.0",
            "supportedFeatures": ["feature1", "feature2"]
        ]
    }
    
    @objc
    func supportedEvents() -> [String]! {
        return [Constants.eventName]
    }
} 