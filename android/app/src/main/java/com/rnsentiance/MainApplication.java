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
import com.rnsentiance.MyPackage;

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
      packages.add(new MyPackage());
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
      Log.i(TAG, "Initializing natively");
      rnSentianceHelper.initializeSentianceSDK(
        new InitOptions.Builder(BuildConfig.APP_ID, BuildConfig.APP_SECRET)
            .autoStart(true)
            .build()
      );
    }
  }
}
