#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(CallManager, RCTEventEmitter)

RCT_EXTERN_METHOD(keepScreenAwake:(BOOL)keepAwake)

@end 
