#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(KeepAwakeModule, NSObject)

RCT_EXTERN_METHOD(keepAwake:(BOOL)enabled)
RCT_EXTERN_METHOD(getCurrentState:(RCTResponseSenderBlock)callback)

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

@end 