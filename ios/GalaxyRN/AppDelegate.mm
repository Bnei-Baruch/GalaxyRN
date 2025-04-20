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

  // Initialize Crisp SDK with website ID
  NSString *websiteID = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CRISP_WEBSITE_ID"];
  if (websiteID) {
    [CrispSDK configureWithWebsiteID:websiteID];
  }

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
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
