#import "AudioManager.h"
#import <CallKit/CallKit.h>
#import "GalaxyRN-Swift.h"
#import <ReactCodegen/GalaxyRNSpec/GalaxyRNSpec.h>

using namespace facebook::react;

@interface AudioManager () <NativeAudioManagerSpec, EventSending>
@end

@implementation AudioManager {
  AudioManagerImpl *_impl;
}

RCT_EXPORT_MODULE(AudioManager)

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [AudioManagerImpl new];
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
  return @[ @"updateAudioDevice" ];
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
  return @{
    @"supportedFeatures" : @[ @"audioDeviceMonitoring", @"audioDeviceSelection" ],
    @"eventTypes" : @{@"audioDeviceChanged" : @"audioDeviceChanged", @"audioRouteChanged" : @"audioRouteChanged"}
  };
}

- (void)activateAudioOutput
{
  [_impl activateAudioOutput];
}

- (void)switchAudioOutput
{
  [_impl switchAudioOutput];
}

- (void)releaseAudioFocus
{
  [_impl releaseAudioFocus];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeAudioManagerSpecJSI>(params);
}

@end
