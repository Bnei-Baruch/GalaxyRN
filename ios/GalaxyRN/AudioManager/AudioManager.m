#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AudioManager, NSObject)

RCT_EXTERN_METHOD(setAudioOutput:(NSString *)deviceType
                  callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(emitDataUpdate:(id)data)

@end 
