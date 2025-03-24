package com.galaxyrn;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

public class VersionModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public VersionModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "VersionModule";
    }

    @ReactMethod
    public void getVersion(Promise promise) {
        try {
            PackageInfo pInfo = reactContext.getPackageManager().getPackageInfo(reactContext.getPackageName(), 0);

            WritableMap versionInfo = Arguments.createMap();
            versionInfo.putString("versionName", pInfo.versionName);
            versionInfo.putInt("versionCode", pInfo.versionCode);

            promise.resolve(versionInfo);
        } catch (PackageManager.NameNotFoundException e) {
            promise.reject("ERROR", "Could not get version info");
        }
    }
}