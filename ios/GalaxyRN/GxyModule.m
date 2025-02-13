#import "GxyModule.h"
#import <React/RCTLog.h>
#import <React/RCTBridgeModule.h>

@implementation GxyModule

RCT_EXPORT_MODULE(GxyModule);

RCT_EXPORT_METHOD(showMessage:(NSString *)message)
{
  RCTLogInfo(@"Received message from React Native: %@", message);
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"AppTerminated"];
}

+ (id)sharedInstance {
  RCTLogInfo(@"GxyModule is loaded!");
  static GxyModule *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[self alloc] init];
  });
  return sharedInstance;
}

+ (void)sendEventWithName:(NSString *)name body:(NSDictionary *)body {
  GxyModule *emitter = [GxyModule sharedInstance];
  if (emitter.bridge) {
    [emitter sendEventWithName:name body:body];
  }
}

@end
