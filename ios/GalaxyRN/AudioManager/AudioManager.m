#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(AudioManager, RCTEventEmitter)

RCT_EXTERN_METHOD(activateAudioOutput)

RCT_EXTERN_METHOD(switchAudioOutput)

RCT_EXTERN_METHOD(releaseAudioFocus)

@end 
