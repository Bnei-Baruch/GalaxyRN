package com.galaxy_mobile;

import android.util.Log;
import com.galaxy_mobile.logger.GxyLogger;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class SendEventToClient {
    static final String TAG = SendEventToClient.class.getSimpleName();
    static ReactContext context = null;

    static public void init(ReactContext context) {
        SendEventToClient.context = context;
    }

    public static void sendEvent(final String eventName, @Nullable WritableMap params) {
        try {
            if (SendEventToClient.context == null) {
                GxyLogger.w(TAG, "sendEvent() BLOCKED - ReactContext is NULL. EventName: " + eventName);
                return;
            }

            if (!SendEventToClient.context.hasActiveCatalystInstance()) {
                GxyLogger.w(TAG, "sendEvent() BLOCKED - CatalystInstance is NOT active. EventName: " + eventName);
                return;
            }

            GxyLogger.d(TAG, "Emitting event to JavaScript: " + eventName);
            SendEventToClient.context
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
            GxyLogger.d(TAG, "Event emitted successfully: " + eventName);

        } catch (Exception e) {
            GxyLogger.e(TAG, "Error sending event '" + eventName + "': ", e);
        }
    }
}
