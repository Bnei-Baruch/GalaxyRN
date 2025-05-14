#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(CallManager, NSObject)

RCT_EXTERN_METHOD(keepScreenAwake:(BOOL)keepAwake)

RCT_EXTERN_METHOD(addListener:(NSString *)eventName)

RCT_EXTERN_METHOD(removeListeners:(double)count)

@end 
