#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface GxyModule : RCTEventEmitter <RCTBridgeModule>
+ (void)sendEventWithName:(NSString *)name body:(NSDictionary *)body;
@end
