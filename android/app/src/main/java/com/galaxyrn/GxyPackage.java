package com.galaxyrn;

import android.os.Build;
import android.util.Log;
import com.galaxyrn.logger.GxyLogger;

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
import com.galaxyrn.foreground.ForegroundModule;
import com.galaxyrn.permissions.PermissionsModule;
import com.galaxyrn.WakeLockModule;
import com.galaxyrn.SendEventToClient;
import com.galaxyrn.logger.LoggerModule;

/**
 * React Native package that registers Galaxy native modules
 */
public class GxyPackage implements ReactPackage {

    private static final String TAG = "GxyPackage";

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        GxyLogger.i(TAG, "Creating Galaxy native modules");

        SendEventToClient.init(reactContext);
        // Add modules
        try {
            GxyLogger.i(TAG, "Adding standard modules");
            modules.add(new LoggerModule(reactContext));

            modules.add(new PermissionsModule(reactContext));
            modules.add(new WakeLockModule(reactContext));
            modules.add(new ForegroundModule(reactContext));
            modules.add(new AudioDeviceModule(reactContext));
            modules.add(new CallListenerModule(reactContext));
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error creating standard modules: " + e.getMessage(), e);
        }

        return modules;
    }
}