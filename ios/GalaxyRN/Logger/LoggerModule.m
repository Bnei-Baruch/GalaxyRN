#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LoggerModule, NSObject)

RCT_EXTERN_METHOD(sendLog:(NSString *)rnLogDir
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end 