package com.galaxyrn;

import android.util.Log;
import com.galaxyrn.logger.GxyLogger;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class SendEventToClient {
    static final String TAG = SendEventToClient.class.getSimpleName();
    static ReactContext context = null;

    static public void init(ReactContext context) {
        if (SendEventToClient.context == null) {
            SendEventToClient.context = context;
        }
    }

    public static void sendEvent(final String eventName, @Nullable WritableMap params) {
        try {
            if (SendEventToClient.context != null && SendEventToClient.context.hasActiveCatalystInstance()) {
                SendEventToClient.context
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit(eventName, params);
            } else {
                GxyLogger.e(SendEventToClient.TAG,
                        "sendEvent(): reactContext is null or not having CatalystInstance yet.");
            }
        } catch (RuntimeException e) {
            GxyLogger.e(SendEventToClient.TAG,
                    "sendEvent(): java.lang.RuntimeException: Trying to invoke JS before CatalystInstance has been set!");
        }
    }
}
