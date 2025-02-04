package com.galaxyrn;

import android.util.Log;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class GxyPackage implements ReactPackage {

    final private String TAG = GxyPackage.class.getSimpleName();;

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        Log.i(TAG, "createNativeModules");
        modules.add(new ForegroundModule(reactContext));
        modules.add(new AudioDeviceModule(reactContext));

        return modules;
    }

}