import Foundation
import React
import AVFoundation
import UIKit

extension AudioManager {
  // MARK: - Audio Monitoring
  
  func setupMonitoring() {
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
