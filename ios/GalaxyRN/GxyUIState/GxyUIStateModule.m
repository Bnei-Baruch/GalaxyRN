#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(GxyUIStateModule, RCTEventEmitter)

RCT_EXTERN_METHOD(startForeground)
RCT_EXTERN_METHOD(stopForeground)

@end 
