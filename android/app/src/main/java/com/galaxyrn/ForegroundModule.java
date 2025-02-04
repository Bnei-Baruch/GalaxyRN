package com.galaxyrn;

import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleEventObserver;
import androidx.lifecycle.ProcessLifecycleOwner;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;


public class ForegroundModule extends ReactContextBaseJavaModule {

    private static final String TAG = "BackgroundServiceModule";
    private final ForegroundService foregroundService = new ForegroundService();

    @Override
    public String getName() {
        return "GxyModule";
    }

    public ForegroundModule(ReactApplicationContext reactContext) {
        super(reactContext);

        // Ensure the observer is added on the main thread
        new Handler(Looper.getMainLooper()).post(() -> {
            ProcessLifecycleOwner.get().getLifecycle().addObserver((LifecycleEventObserver) (source, event) -> {
                if (event == Lifecycle.Event.ON_STOP) {
                    // App entered the background
                    Log.d(TAG, "App is in the background");
                    foregroundService.start(reactContext);
                } else if (event == Lifecycle.Event.ON_START) {
                    // App entered the foreground
                    Log.d(TAG, "App is in the foreground");
                    foregroundService.stop(reactContext);
                }
            });
        });
    }


    @Override
    public void invalidate() {
        super.invalidate();
        foregroundService.stop(getReactApplicationContext());
    }
}