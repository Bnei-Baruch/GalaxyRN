#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
// Import Crisp SDK header
#import <Crisp/Crisp-Swift.h>

@implementation AppDelegate
- (BOOL)application: (UIApplication *)application
              openURL: (NSURL *)url
              options: (NSDictionary<UIApplicationOpenURLOptionsKey, id> *) options
 {
   if ([self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:url]) {
     return YES;
   }
   return [RCTLinkingManager application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"GalaxyRN";
  self.initialProps = @{};

  // Initialize Crisp SDK with website ID - move to background thread
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSString *websiteID = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CRISP_WEBSITE_ID"];
    if (websiteID) {
      dispatch_async(dispatch_get_main_queue(), ^{
        [CrispSDK configureWithWebsiteID:websiteID];
      });
    }
  });

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  // Load bundle URL in background
  __block NSURL *bundleURL = nil;
  dispatch_sync(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    bundleURL = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  });
  return bundleURL;
#endif
}

@end
