import Foundation
import AVFoundation

extension AudioManager {
    // MARK: - Audio Monitoring
  
    func setupMonitoring() {
        NLOG("[audioDevices swift] setupMonitoring")
        
        // Remove any existing observers first to avoid duplicates
        NotificationCenter.default.removeObserver(
            self,
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
        
        // Add the observer
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleRouteChange),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
    }
  
    @objc
    private func handleRouteChange(notification: Notification) {
        NLOG("[audioDevices swift] handleRouteChange")
        guard let userInfo = notification.userInfo,
              let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            NLOG("[audioDevices swift] Failed to get route change details")
            return
        }
    
        // Log the reason for the route change
        switch reason {
        case .newDeviceAvailable:
            NLOG("[audioDevices swift] Route change: New device available")
        case .oldDeviceUnavailable:
            NLOG("[audioDevices swift] Route change: Old device unavailable")
            // Check if the disconnected device was from bluetooth group
            if let previousRoute = userInfo[AVAudioSessionRouteChangePreviousRouteKey] as? AVAudioSessionRouteDescription {
                let previousOutputs = previousRoute.outputs
                for output in previousOutputs {
                    let outputGroup = getGroupByPortType(output.portType)
                    if outputGroup == .bluetooth {
                        NLOG("[audioDevices swift] 🔵 Bluetooth group device disconnected: \(output.portName) (\(output.uid))")
                        NLOG("[audioDevices swift] 🔄 Switching to earpiece due to Bluetooth group disconnection")
                        activateOutputByGroup(.earpiece)
                        sendCurrentAudioGroup()
                    }
                }
            }
        case .categoryChange:
            NLOG("[audioDevices swift] Route change: Category changed")
        case .override:
            NLOG("[audioDevices swift] Route change: Override")
        case .wakeFromSleep:
            NLOG("[audioDevices swift] Route change: Wake from sleep")
        case .noSuitableRouteForCategory:
            NLOG("[audioDevices swift] Route change: No suitable route for category")
        case .routeConfigurationChange:
            NLOG("[audioDevices swift] Route change: Route configuration change")
        case .unknown:
            NLOG("[audioDevices swift] Route change: Unknown reason")
        @unknown default:
            NLOG("[audioDevices swift] Route change: Unhandled reason code \(reasonValue)")
        }
    
        // Log current route details
        let session = AVAudioSession.sharedInstance()
        let currentRoute = session.currentRoute
    
        NLOG("[audioDevices swift] Current inputs: \(currentRoute.inputs.map { "\($0.portName) (\($0.uid))" }.joined(separator: ", "))")
        NLOG("[audioDevices swift] Current outputs: \(currentRoute.outputs.map { "\($0.portName) (\($0.uid))" }.joined(separator: ", "))")
    
        sendCurrentAudioGroup()
    }
} 
