import Foundation

enum Constants {
    static let moduleName = "CallManager"
    static let eventName = "CallManagerEvent"
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