import Foundation
import React

extension CallManager {
    @objc
  override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
  override func constantsToExport() -> [AnyHashable : Any]! {
        return [
            "version": "1.0.0",
            "supportedFeatures": ["feature1", "feature2"]
        ]
    }
} 
