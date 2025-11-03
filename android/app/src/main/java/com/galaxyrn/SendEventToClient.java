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
                GxyLogger.d(TAG, "Emitting event to JavaScript: " + eventName);
                SendEventToClient.context
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit(eventName, params);
                GxyLogger.d(TAG, "Event emitted successfully: " + eventName);
            } else {
                GxyLogger.w(SendEventToClient.TAG, "sendEvent() BLOCKED. EventName: " + eventName);
                if (SendEventToClient.context == null) {
                    GxyLogger.d(SendEventToClient.TAG, "ReactContext is NULL");
                } else {
                    GxyLogger.d(SendEventToClient.TAG, "CatalystInstance is NOT active");
                }
            }
        } catch (RuntimeException e) {
            GxyLogger.e(SendEventToClient.TAG,
                    "sendEvent() RuntimeException for event '" + eventName + "': " + e.getMessage(), e);
        } catch (Exception e) {
            GxyLogger.e(SendEventToClient.TAG,
                    "sendEvent() Exception for event '" + eventName + "': " + e.getMessage(), e);
        }
    }
}
