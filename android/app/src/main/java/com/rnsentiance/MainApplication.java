package com.rnsentiance;

import android.app.Application;
import android.util.Log;

import com.facebook.react.PackageList;
import com.facebook.hermes.reactexecutor.HermesExecutorFactory;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;

import com.sentiance.react.bridge.RNSentianceHelper;

import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  // Read SENTIANCE_APP_ID and SENTIANCE_APP_SECRET from any safe source
  private static final String SENTIANCE_APP_ID = "";
  private static final String SENTIANCE_SECRET = "";
  private static final String TAG = "TestApp";

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

//    RNSentianceHelper rnSentianceHelper = RNSentianceHelper.getInstance(getApplicationContext());
//    rnSentianceHelper.initializeSentianceSDK(
//            SENTIANCE_APP_ID,SENTIANCE_SECRET, // app id and secret
//            true, //auto start
//            null, // init callback
//            null // start callback
//    );
  }
}
