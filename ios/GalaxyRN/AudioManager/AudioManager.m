#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(AudioManager, RCTEventEmitter)

RCT_EXTERN_METHOD(setAudioOutput:(NSString *)deviceType
                  callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(emitDataUpdate:(id)data)

@end 
