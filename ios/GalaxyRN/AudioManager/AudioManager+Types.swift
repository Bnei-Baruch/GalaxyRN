import Foundation
import AVFoundation
import UIKit

// Matches RCTEventEmitter's sendEventWithName:body: selector exactly, so any
// RCTEventEmitter subclass (our ObjC TurboModule wrappers) satisfies this
// conformance for free, without writing any glue code.
@objc public protocol EventSending: AnyObject {
    func sendEvent(withName name: String, body: Any?)
}

enum AudioManagerConstants {
    static let moduleName = "AudioManager"
    static let eventName = "updateAudioDevice"
    
    static let audioDeviceChanged = "audioDeviceChanged"
    static let audioRouteChanged = "audioRouteChanged"
}

protocol AudioManagerDataProcessing {
    func process(data: Any) -> Result<Any, Error>
}
