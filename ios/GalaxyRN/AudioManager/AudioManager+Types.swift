import Foundation
import AVFoundation
import UIKit

enum AudioManagerConstants {
    static let moduleName = "AudioManager"
    static let eventName = "updateAudioDevice"
    
    static let audioDeviceChanged = "audioDeviceChanged"
    static let audioRouteChanged = "audioRouteChanged"
    
    static let errorNoDevice = "No audio device available"
    static let errorInvalidDevice = "Invalid audio device"
    static let errorSetOutputFailed = "Failed to set audio output"
    static let errorUnsupportedIOSVersion = "This feature requires iOS 7.0 or later"
    
    static let minimumIOSVersion: Float = 7.0
}

enum AudioManagerError: Error {
    case invalidParameters
    case processingFailed
    case noDeviceAvailable
    case invalidDevice
    case setOutputFailed
    case unsupportedIOSVersion
    
    var message: String {
        switch self {
        case .invalidParameters:
            return "Invalid parameters provided"
        case .processingFailed:
            return "Processing failed"
        case .noDeviceAvailable:
            return AudioManagerConstants.errorNoDevice
        case .invalidDevice:
            return AudioManagerConstants.errorInvalidDevice
        case .setOutputFailed:
            return AudioManagerConstants.errorSetOutputFailed
        case .unsupportedIOSVersion:
            return AudioManagerConstants.errorUnsupportedIOSVersion
        }
    }
}

enum AudioDeviceType: String {
    case builtInSpeaker = "builtInSpeaker"
    case builtInReceiver = "builtInReceiver"
    case builtInMic = "builtInMic"
    
    case headphone = "headphone"
    case headsetMic = "headsetMic"
    
    case bluetoothA2DP = "bluetoothA2DP"
    case bluetoothHFP = "bluetoothHFP"
    case bluetoothLE = "bluetoothLE"
    
    case airPlay = "airPlay"
    
    case externalSpeaker = "externalSpeaker"
    case externalMic = "externalMic"
    case externalAudio = "externalAudio"
    
    case carAudio = "carAudio"
    case usbAudio = "usbAudio"
    case unknown = "unknown"
    
    static func from(port: AVAudioSession.Port) -> AudioDeviceType {
        switch port {
        case .builtInSpeaker:
            return .builtInSpeaker
        case .builtInReceiver:
            return .builtInReceiver
        case .builtInMic:
            return .builtInMic
        case .headphones:
            return .headphone
        case .headsetMic:
            return .headsetMic
        case .bluetoothA2DP:
            return .bluetoothA2DP
        case .bluetoothHFP:
            return .bluetoothHFP
        case .bluetoothLE:
            return .bluetoothLE
        case .airPlay:
            return .airPlay
        case .carAudio:
            return .carAudio
        case .usbAudio:
            return .usbAudio
        default:
          return .builtInSpeaker
        }
    }
    
    var portType: AVAudioSession.Port {
        switch self {
        case .builtInSpeaker:
            return .builtInSpeaker
        case .builtInReceiver:
            return .builtInReceiver
        case .builtInMic:
            return .builtInMic
        case .headphone:
            return .headphones
        case .headsetMic:
            return .headsetMic
        case .bluetoothA2DP:
            return .bluetoothA2DP
        case .bluetoothHFP:
            return .bluetoothHFP
        case .bluetoothLE:
            return .bluetoothLE
        case .airPlay:
            return .airPlay
        case .carAudio:
            return .carAudio
        case .usbAudio:
            return .usbAudio
        case .externalSpeaker:
            return .lineOut
        case .externalMic:
            return .lineIn
        case .externalAudio:
            return .lineIn
        case .unknown:
            return .builtInSpeaker
        }
    }
    
    var minimumIOSVersion: Float {
        switch self {
        case .bluetoothLE:
            return 10.0
        case .usbAudio:
            return 9.0
        case .carAudio:
            return 8.0
        default:
            return 7.0
        }
    }
    
    var description: String {
        switch self {
        case .builtInSpeaker:
            return "Built-in Speaker"
        case .builtInReceiver:
            return "Built-in Receiver"
        case .builtInMic:
            return "Built-in Microphone"
        case .headphone:
            return "Headphones"
        case .headsetMic:
            return "Headset Microphone"
        case .bluetoothA2DP:
            return "Bluetooth A2DP"
        case .bluetoothHFP:
            return "Bluetooth Hands-Free Profile"
        case .bluetoothLE:
            return "Bluetooth Low Energy"
        case .airPlay:
            return "AirPlay"
        case .externalSpeaker:
            return "External Speaker"
        case .externalMic:
            return "External Microphone"
        case .externalAudio:
            return "External Audio"
        case .carAudio:
            return "Car Audio"
        case .usbAudio:
            return "USB Audio"
        case .unknown:
            return "Unknown Device"
        }
    }
}

protocol AudioManagerDataProcessing {
    func process(data: Any) -> Result<Any, Error>
}

extension AudioManager {
    static func isIOSVersionSupported() -> Bool {
        let systemVersion = UIDevice.current.systemVersion
        return (systemVersion as NSString).floatValue >= AudioManagerConstants.minimumIOSVersion
    }
    
    static func isDeviceTypeSupported(_ deviceType: AudioDeviceType) -> Bool {
        let systemVersion = UIDevice.current.systemVersion
        return (systemVersion as NSString).floatValue >= deviceType.minimumIOSVersion
    }
}
