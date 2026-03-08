import Foundation
import AVFoundation
import CallKit
import WebRTC

extension CallManager: CXProviderDelegate {
    // MARK: - CXProviderDelegate
    func providerDidReset(_ provider: CXProvider) {}

    // MARK: - CXProviderDelegate didActivate and didDeactivate methods
    func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        NLOG("[callManager swift] provider didActivate audioSession: \(audioSession)")
        self.audioSession = audioSession
        RTCAudioSession.sharedInstance().audioSessionDidActivate(audioSession)
    }

    func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
        NLOG("[callManager swift] provider didDeactivate audioSession: \(audioSession)")
        self.audioSession = nil
        RTCAudioSession.sharedInstance().audioSessionDidDeactivate(audioSession)
    }
}
