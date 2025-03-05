package com.galaxyrn;

import android.os.Build;
import android.util.Log;

import androidx.annotation.RequiresApi;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.galaxyrn.audioManager.AudioDeviceModule;
import com.galaxyrn.callManager.CallListenerModule;

public class GxyPackage implements ReactPackage {

    final private String TAG = GxyPackage.class.getSimpleName();

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        Log.i(TAG, "createNativeModules");
        modules.add(new ForegroundModule(reactContext));
        modules.add(new AudioDeviceModule(reactContext));
        modules.add(new CallListenerModule(reactContext));

        return modules;
    }

}