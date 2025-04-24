import Foundation
import React

@objc(VersionModule)
class VersionModule: NSObject, RCTBridgeModule {

  static func moduleName() -> String! {
    return "VersionModule"
  }

  // Ensure this runs on the main thread if it interacts with UI elements
  // For getting app version, background thread is fine.
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc(getVersion:rejecter:)
  func getVersion(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
    guard let infoDict = Bundle.main.infoDictionary,
          let version = infoDict["CFBundleShortVersionString"] as? String,
          let buildString = infoDict["CFBundleVersion"] as? String,
          let buildNumber = Int(buildString) else {
      let error = NSError(domain: "VersionModule", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not retrieve or parse app version information"])
      reject("VERSION_ERROR", "Failed to get or parse app version information", error)
      return
    }
    
    let versionInfo: [String: Any] = [
        "versionName": version,
        "versionCode": buildNumber
    ]
    resolve(versionInfo)
  }
} 