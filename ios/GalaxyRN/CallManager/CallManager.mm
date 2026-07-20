#import "CallManager.h"
#import <CallKit/CallKit.h>
#import "GalaxyRN-Swift.h"
#import <ReactCodegen/GalaxyRNSpec/GalaxyRNSpec.h>

using namespace facebook::react;

@interface CallManager () <NativeCallManagerSpec, EventSending>
@end

@implementation CallManager {
  CallManagerImpl *_impl;
}

RCT_EXPORT_MODULE(CallManager)

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [CallManagerImpl new];
    _impl.eventSender = self;
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"onCallStateChanged" ];
}

- (void)startObserving
{
  [_impl startObserving];
}

- (void)stopObserving
{
  [_impl stopObserving];
}

- (NSDictionary *)constantsToExport
{
  return @{@"version" : @"1.0.0", @"supportedFeatures" : @[ @"feature1", @"feature2" ]};
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeCallManagerSpecJSI>(params);
}

@end
