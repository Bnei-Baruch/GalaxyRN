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
import com.galaxy_mobile.backgroundTimer.BackgroundTimerModule;
import com.galaxy_mobile.callManager.CallListenerModule;
import com.galaxy_mobile.uiState.GxyUIStateModule;
import com.galaxy_mobile.SendLogsModule;

/**
 * React Native package that registers Galaxy native modules
 */
public class GxyPackage implements ReactPackage {

    private static final String TAG = "GxyPackage";

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        GxyLogger.i(TAG, "Creating Galaxy native modules");

        // Each module is created in isolation: one failing constructor must not
        // drop the modules after it. This runs on a background thread without a
        // Looper under the new architecture, often before native Sentry is ready.
        addModule(modules, "AudioDeviceModule", () -> new AudioDeviceModule(reactContext));
        addModule(modules, "BackgroundTimerModule", () -> new BackgroundTimerModule(reactContext));
        addModule(modules, "CallListenerModule", () -> new CallListenerModule(reactContext));
        addModule(modules, "SendLogsModule", () -> new SendLogsModule(reactContext));
        addModule(modules, "GxyUIStateModule", () -> new GxyUIStateModule(reactContext));

        return modules;
    }

    private interface ModuleFactory {
        NativeModule create();
    }

    private static void addModule(List<NativeModule> modules, String name, ModuleFactory factory) {
        try {
            modules.add(factory.create());
        } catch (Throwable e) {
            Log.e(TAG, "Error creating " + name, e);
            GxyLogger.e(TAG, "Error creating " + name + ": " + e.getMessage(), e);
        }
    }
}