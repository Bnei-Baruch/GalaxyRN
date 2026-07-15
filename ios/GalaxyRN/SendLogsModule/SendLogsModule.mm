#import "SendLogsModule.h"
#import <CallKit/CallKit.h>
#import "GalaxyRN-Swift.h"
#import <ReactCodegen/GalaxyRNSpec/GalaxyRNSpec.h>

using namespace facebook::react;

@interface SendLogsModule () <NativeSendLogsModuleSpec>
@end

@implementation SendLogsModule {
  SendLogsModuleImpl *_impl;
}

RCT_EXPORT_MODULE(SendLogsModule)

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [SendLogsModuleImpl new];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)sendLogs:(NSString *)email resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [_impl sendLogs:email resolve:resolve reject:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeSendLogsModuleSpecJSI>(params);
}

@end
