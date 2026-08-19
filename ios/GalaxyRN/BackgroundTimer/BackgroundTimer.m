#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(BackgroundTimer, RCTEventEmitter)

RCT_EXTERN_METHOD(setTimeout:(nonnull NSNumber *)timeoutId timeoutMs:(nonnull NSNumber *)timeoutMs)

@end
