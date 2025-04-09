import Foundation

enum CallManagerConstants {
    static let moduleName = "CallManager"
    static let eventName = "onCallStateChanged"
}

enum CallManagerError: Error {
    case invalidParameters
    case processingFailed
    
    var message: String {
        switch self {
        case .invalidParameters:
            return "Invalid parameters provided"
        case .processingFailed:
            return "Processing failed"
        }
    }
}

protocol DataProcessing {
    func process(data: Any) -> Result<Any, Error>
}

enum CallEvents: String {
    case ON_START_CALL
    case ON_END_CALL
    case OTHERS
}