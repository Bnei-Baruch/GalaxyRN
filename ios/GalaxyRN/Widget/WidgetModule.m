#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(WidgetModule, RCTEventEmitter)

RCT_EXTERN_METHOD(setState:(NSString *)room
                  isInRoom:(BOOL)isInRoom
                  isMicOn:(BOOL)isMicOn
                  isCammute:(BOOL)isCammute
                  isAudioMode:(BOOL)isAudioMode)

RCT_EXTERN_METHOD(consumePending:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
