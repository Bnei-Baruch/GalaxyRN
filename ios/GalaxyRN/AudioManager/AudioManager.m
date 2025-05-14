#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AudioManager, NSObject)

RCT_EXTERN_METHOD(activateAudioOutput)

RCT_EXTERN_METHOD(switchAudioOutput)

RCT_EXTERN_METHOD(releaseAudioFocus)

RCT_EXTERN_METHOD(addListener:(NSString *)eventName)

RCT_EXTERN_METHOD(removeListeners:(double)count)

@end 
