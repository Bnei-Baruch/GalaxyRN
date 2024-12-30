package com.galaxyrn;


import android.content.Intent;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.oney.WebRTCModule.MediaProjectionService;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class GxyModule extends ReactContextBaseJavaModule {

    private static final String TAG = "BackgroundServiceModule";
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

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
        //executor.execute(() -> ForegroundService.start(getReactApplicationContext()));
        ForegroundService.start(getReactApplicationContext());
    }

    @Override
    public void invalidate() {
        super.invalidate();
        Log.d(TAG, "Stop background service");
        ForegroundService.abort(getReactApplicationContext());
        executor.shutdownNow();
    }
}