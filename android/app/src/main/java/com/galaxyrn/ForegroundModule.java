package com.galaxyrn;

import androidx.annotation.RequiresApi;
import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleEventObserver;
import androidx.lifecycle.ProcessLifecycleOwner;

import android.app.Activity;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.WindowManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;


@RequiresApi(api = Build.VERSION_CODES.ECLAIR)
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
                    Log.d(TAG, "App is in the background");
                    foregroundService.start(reactContext);
                    keepScreenOff();
                } else if (event == Lifecycle.Event.ON_START) {
                    Log.d(TAG, "App is in the foreground");
                    foregroundService.stop(reactContext);
                    keepScreenOn();
                }
            });
        });
    }


    @Override
    public void invalidate() {
        super.invalidate();
        keepScreenOff();
        foregroundService.stop(getReactApplicationContext());
    }

    private void keepScreenOn() {
        Activity activity = getCurrentActivity();

        if (activity == null) {
            Log.d(TAG, "ReactContext doesn't have any Activity attached.");
            return;
        }
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private void keepScreenOff() {
        Activity activity = getCurrentActivity();

        if (activity == null) {
            Log.d(TAG, "ReactContext doesn't have any Activity attached.");
            return;
        }

        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

}