import Foundation

extension AudioManagerImpl {
    // Method to handle starting observation
    public func startObserving() {
        hasListeners = true
        NLOG("[audioDevices swift] startObserving")
        sendCurrentAudioGroup()
    }

    // Method to handle stopping observation
    public func stopObserving() {
        hasListeners = false
    }

    // Event emitter method
    func sendCurrentAudioGroup() {
        NLOG("[audioDevices swift] 📢 Sending current audio group to JS")
        if hasListeners {
            let body = getCurrentAudioDevice()
            NLOG("[audioDevices swift] 📢 Emitting event with data:", body)
            eventSender?.sendEvent(withName: AudioManagerConstants.eventName, body: body)
            NLOG("[audioDevices swift] 📢 Event emitted successfully")
        } else {
            NLOG("[audioDevices swift] ⚠️ Not emitting event - no JS listeners registered")
        }
    }

    private func getCurrentAudioDevice() -> [[String: Any]] {
        var resp: [String: Any] = [:]

        let output = audioSession.currentRoute.outputs.first
        let type = getCurrentAudioOutputGroup()
        resp["name"] = output?.uid
        resp["type"] = String(describing: type)
        resp["active"] = true
        NLOG("[audioDevices swift] getCurrentAudioDevice resp", resp)
        return [resp]
    }
}
