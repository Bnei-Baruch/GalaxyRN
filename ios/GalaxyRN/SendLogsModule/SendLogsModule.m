#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SendLogsModule, NSObject)

RCT_EXTERN_METHOD(sendLogs:(NSString *)email
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

