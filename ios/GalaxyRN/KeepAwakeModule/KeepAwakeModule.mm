#import "KeepAwakeModule.h"
#import <CallKit/CallKit.h>
#import "GalaxyRN-Swift.h"
#import <ReactCodegen/GalaxyRNSpec/GalaxyRNSpec.h>

using namespace facebook::react;

@interface KeepAwakeModule () <NativeKeepAwakeModuleSpec>
@end

@implementation KeepAwakeModule {
  KeepAwakeModuleImpl *_impl;
}

RCT_EXPORT_MODULE(KeepAwakeModule)

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [KeepAwakeModuleImpl new];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (void)keepScreenOn
{
  [_impl keepScreenOn];
}

- (void)releaseScreenOn
{
  [_impl releaseScreenOn];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeKeepAwakeModuleSpecJSI>(params);
}

@end
