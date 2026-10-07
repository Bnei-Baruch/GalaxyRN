#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SendLogsModule, NSObject)

RCT_EXTERN_METHOD(appendLogs:(NSString *)text)

RCT_EXTERN_METHOD(setVerboseUntil:(double)until)

RCT_EXTERN_METHOD(readLogs:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
