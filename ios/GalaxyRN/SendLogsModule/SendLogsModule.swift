import Foundation
import React

/**
 * Bridge to the persistent log file (LogFileWriter). JS batches its log lines
 * into appendLogs; "Send logs" reads everything back via readLogs and uploads
 * it to Sentry from JS.
 */
@objc(SendLogsModule)
class SendLogsModule: NSObject {
    private static let TAG = "SendLogsModule"

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc
    func appendLogs(_ text: String) {
        LogFileWriter.shared.append(text)
    }

    @objc
    func setVerboseUntil(_ until: Double) {
        LogFileWriter.shared.setVerboseUntil(until)
    }

    @objc
    func readLogs(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        LogFileWriter.shared.readAll { result in
            switch result {
            case .success(let logs):
                resolve(logs)
            case .failure(let error):
                GxyLogger.e(SendLogsModule.TAG, "Error reading log files", error)
                reject("LOG_READ_ERROR", "Failed to read logs: \(error.localizedDescription)", error)
            }
        }
    }
}
