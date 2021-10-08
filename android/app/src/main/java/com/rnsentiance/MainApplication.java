package com.rnsentiance;

import android.app.Application;
import android.util.Log;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;

import com.sentiance.react.bridge.RNSentianceHelper;
import com.sentiance.react.bridge.InitOptions;

import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private static final String TAG = "RNSentiance example app";

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      @SuppressWarnings("UnnecessaryLocalVariable")
      List<ReactPackage> packages = new PackageList(this).getPackages();
      // Packages that cannot be autolinked yet can be added manually here, for example:
      // packages.add(new MyReactNativePackage());
      return packages;
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);

    RNSentianceHelper rnSentianceHelper = RNSentianceHelper.getInstance(getApplicationContext());
    Boolean isNativeInitializationEnabled = rnSentianceHelper.isNativeInitializationEnabled();

    if (isNativeInitializationEnabled) {
      // SDK initialization creates a Sentiance user on the device. If your app makes use of the SDK's user-linking
      // feature, you will want to initialize the SDK in the javascript code first (e.g. after your user logs in),
      // so that you are able to do user linking there.
      // In this case, to prevent accidentally initializing the SDK here first, instead of calling `initializeSentianceSDK`,
      // call `initializeSentianceSDKIfUserLinkingCompleted`. This method will initialize the SDK only if a Sentiance
      // user exists, and has already been linked.

      Log.i(TAG, "Initializing natively");
      rnSentianceHelper.initializeSentianceSDK(
        new InitOptions.Builder(BuildConfig.APP_ID, BuildConfig.APP_SECRET)
            .autoStart(true)
            .build()
      );
    }
  }
}
