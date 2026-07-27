#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(CallManager, RCTEventEmitter)

RCT_EXTERN_METHOD(startCall:(NSString *)handle isVideo:(BOOL)isVideo)
RCT_EXTERN_METHOD(endCall)

@end 
