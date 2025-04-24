#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

// Expose the Swift module to React Native
@interface RCT_EXTERN_MODULE(VersionModule, NSObject)

// Expose the getVersion method
// The method signature in Swift is getVersion(_:rejecter:)
// The Objective-C representation requires specifying resolver and rejecter explicitly.
RCT_EXTERN_METHOD(getVersion:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)

@end 