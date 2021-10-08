/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

#import "ReactNativeConfig.h"
#import "RNSentiance.h" // Import Sentiance React Native bridge module

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"RNSentiance" initialProperties:nil];

  NSString *SENTIANCE_APP_ID = [ReactNativeConfig envFor:@"APP_ID"];;
  NSString *SENTIANCE_APP_SECRET = [ReactNativeConfig envFor:@"APP_SECRET"];;
  BOOL isNativeInitializationEnabled = [[bridge moduleForName:@"RNSentiance"] isNativeInitializationEnabled];
  
  if (isNativeInitializationEnabled) {
    // SDK initialization creates a Sentiance user on the device. If your app
    // makes use of the SDK's user-linking feature, you will want to initialize
    // the SDK in the javascript code first (e.g. after your user logs in), so
    // that you are able to do user linking there.
    // In this case, to prevent accidentally initializing the SDK here first, instead
    // of calling `initSDK`, call `initSDKIfUserLinkingCompleted`. This method will
    // initialize the SDK only if a Sentiance user exists, and has already been linked.
    
    [[bridge moduleForName:@"RNSentiance"] initSDK:SENTIANCE_APP_ID secret:SENTIANCE_APP_SECRET baseURL:nil shouldStart:YES resolver:nil rejecter:nil];
    NSLog(@"Initializing natively");
  }

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
