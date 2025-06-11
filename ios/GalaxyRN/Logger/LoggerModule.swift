import Foundation
import React
import UIKit

/**
 * React Native Logger Module for GalaxyRN iOS Application
 * Provides access to GxyLogger functionality and log compression/sending
 * capabilities
 */
@objc(LoggerModule)
class LoggerModule: NSObject {
    
    private static let TAG = "LoggerModule"
    
    override init() {
        super.init()
        GxyLoggerUtils.initializeFileLogging()
    }
    
    @objc
    static func moduleName() -> String! {
        return "LoggerModule"
    }
    
    /**
     * Compress a directory and send it to Sentry as an attachment
     *
     * @param rnLogDir The directory path containing logs to compress and send
     * @param resolve  React Native promise resolve callback
     * @param reject   React Native promise reject callback
     */
    @objc
    func sendLog(_ rnLogDir: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.global(qos: .background).async {
            do {
                GxyLogger.i(LoggerModule.TAG, "Starting log compression and send process for directory: \(rnLogDir)")
                
                // Compress and send to Sentry
                let compressedFile = try SentryUtils.compressAndSendLogsToSentry(rnLogDir: rnLogDir)
                
                if compressedFile == nil {
                    let error = "Failed to compress and send log directory"
                    GxyLogger.e(LoggerModule.TAG, error)
                    reject("COMPRESSION_FAILED", error, nil)
                    return
                }
                
                resolve("Logs compressed and sent to Sentry successfully")
                GxyLogger.i(LoggerModule.TAG, "Log compression and send process completed successfully")
                
            } catch {
                let errorMessage = "Error in sendLog: \(error.localizedDescription)"
                GxyLogger.e(LoggerModule.TAG, errorMessage, error)
                reject("SEND_LOG_ERROR", errorMessage, error)
            }
        }
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
} 