package com.galaxyrn;

import android.content.Context;
import android.os.PowerManager;
import android.util.Log;
import android.view.WindowManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.Objects;

public class KeepAwakeModule extends ReactContextBaseJavaModule {

    private final PowerManager powerManager;
    private PowerManager.WakeLock wakeLock;

    public KeepAwakeModule(ReactApplicationContext reactContext) {
        super(reactContext);
        powerManager = (PowerManager) reactContext.getSystemService(Context.POWER_SERVICE);
    }

    @Override
    public String getName() {
        return "KeepAwakeModule";
    }

    @ReactMethod
    public void activate(Boolean isAudioMode) {
        Log.i("GalaxyRN custom: KeepAwakeModule", "activate  isAudioMode = " + isAudioMode.toString());
        deactivate();

        if (isAudioMode) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "galaxyrn:KeepAwakeTag:audioMode");
            wakeLock.acquire();
        } else {
            var window = Objects.requireNonNull(getCurrentActivity()).getWindow();
            window.setFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON, WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
    }

    @ReactMethod
    public void deactivate() {
        Log.i("GalaxyRN custom: KeepAwakeModule", "deactivate");
        var window = Objects.requireNonNull(getCurrentActivity()).getWindow();
        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }
}