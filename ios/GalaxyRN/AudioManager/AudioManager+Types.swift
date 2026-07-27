import Foundation
import AVFoundation
import UIKit

enum AudioManagerConstants {
    static let moduleName = "AudioManager"
    static let eventName = "updateAudioDevice"
    
    static let audioDeviceChanged = "audioDeviceChanged"
    static let audioRouteChanged = "audioRouteChanged"
}

protocol AudioManagerDataProcessing {
    func process(data: Any) -> Result<Any, Error>
}
