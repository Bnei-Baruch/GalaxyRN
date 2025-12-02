package com.galaxy_mobile;

import android.os.Build;
import android.util.Log;
import com.galaxy_mobile.logger.GxyLogger;

import androidx.annotation.RequiresApi;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.galaxy_mobile.audioManager.AudioDeviceModule;
import com.galaxy_mobile.callManager.CallListenerModule;
import com.galaxy_mobile.foreground.ForegroundModule;
import com.galaxy_mobile.permissions.PermissionsModule;
import com.galaxy_mobile.WakeLockModule;
import com.galaxy_mobile.SendLogsModule;
import com.galaxy_mobile.SendEventToClient;

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
            modules.add(new ForegroundModule(reactContext));
            modules.add(new PermissionsModule(reactContext));
            modules.add(new WakeLockModule(reactContext));
            modules.add(new AudioDeviceModule(reactContext));
            modules.add(new CallListenerModule(reactContext));
            modules.add(new SendLogsModule(reactContext));
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error creating standard modules: " + e.getMessage(), e);
        }

        return modules;
    }
}