#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(KeepAwakeModule, NSObject)

RCT_EXTERN_METHOD(keepScreenOn)
RCT_EXTERN_METHOD(releaseScreenOn)

@end 
