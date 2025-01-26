package com.galaxyrn;


import android.content.Context;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;


public class GxyModule extends ReactContextBaseJavaModule {

    private static final String TAG = "BackgroundServiceModule";
    private final ForegroundService foregroundService = new ForegroundService();

    public GxyModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "GxyModule";
    }

    @Override
    public void initialize() {
        super.initialize();

        Log.d(TAG, "Start background service");
        Context context = getReactApplicationContext();
        foregroundService.start(context);

    }

    @ReactMethod
    public void startBackgroundService() {
        Log.d(TAG, "Start background service");
        // foregroundService.start(getReactApplicationContext());
    }

    @Override
    public void invalidate() {
        super.invalidate();
        Context context = getReactApplicationContext();
        foregroundService.abort(context);
    }
}