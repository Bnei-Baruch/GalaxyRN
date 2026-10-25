package com.galaxy_mobile.widget;

import com.facebook.fbreact.specs.NativeWidgetModuleSpec;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.galaxy_mobile.logger.GxyLogger;

/**
 * Bridge between JS (src/zustand/widget.ts) and the home-screen widget
 * (GxyWidgetProvider): JS pushes the app state, the widget reports toggles.
 */
@ReactModule(name = WidgetModule.NAME)
public class WidgetModule extends NativeWidgetModuleSpec {
    public static final String NAME = "WidgetModule";
    private static final String TAG = "WidgetModule";

    // Static self-ref so GxyWidgetProvider (a BroadcastReceiver) can tell
    // whether JS is alive and route toggles to it
    private static WidgetModule instance;

    public WidgetModule(ReactApplicationContext reactContext) {
        super(reactContext);
        instance = this;
    }

    @Override
    public void invalidate() {
        super.invalidate();
        if (instance == this) {
            instance = null;
        }
    }

    static boolean isAlive() {
        return instance != null;
    }

    static void notifyAction() {
        if (instance != null) {
            instance.emitWidgetAction(Arguments.createMap());
        }
    }

    @Override
    @ReactMethod
    @DoNotStrip
    public void setState(String room, boolean isInRoom, boolean isMicOn, boolean isCammute,
            boolean isAudioMode) {
        GxyLogger.d(TAG, "setState: room: " + room + " isInRoom: " + isInRoom + " isMicOn: " + isMicOn
                + " isCammute: " + isCammute + " isAudioMode: " + isAudioMode);
        GxyWidgetProvider.setState(getReactApplicationContext(), room, isInRoom, isMicOn, isCammute,
                isAudioMode);
    }

    @Override
    @ReactMethod
    @DoNotStrip
    public void consumePending(Promise promise) {
        boolean[] pending = GxyWidgetProvider.consumePending(getReactApplicationContext());
        WritableMap result = Arguments.createMap();
        result.putBoolean("pending", pending[0]);
        result.putBoolean("isMicOn", pending[1]);
        result.putBoolean("isCammute", pending[2]);
        result.putBoolean("isAudioMode", pending[3]);
        promise.resolve(result);
    }
}
