package com.galaxy_mobile.callManager;

import android.util.Log;
import com.galaxy_mobile.logger.GxyLogger;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.galaxy_mobile.SendEventToClient;
import com.galaxy_mobile.foreground.ForegroundService;

import io.sentry.Sentry;

/**
 * Manages and dispatches call events to JavaScript layer.
 * Handles bringing the app to foreground after calls.
 */
public class CallEventManager {
    private static final String TAG = "CallEventManager";

    /**
     * Dispatches a call state event to the JavaScript layer
     * 
     * @param state The call state to dispatch
     */
    public static void dispatchCallStateEvent(CallStateType state) {
        GxyLogger.d(TAG, "dispatchCallStateEvent() called with state: " + state.name());
        try {
            WritableMap data = Arguments.createMap();
            data.putString("state", state.name());
            GxyLogger.d(TAG, "Calling SendEventToClient.sendEvent() with data: " + data.toString());
            SendEventToClient.sendEvent("onCallStateChanged", data);
            GxyLogger.d(TAG, "SendEventToClient.sendEvent() completed for state: " + state.name());
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error in dispatchCallStateEvent for state " + state.name() + ": " + e.getMessage(), e);
            Sentry.captureException(e);
        }
    }

    /**
     * Brings the application to foreground after a call ends
     * 
     * @param context The React application context
     */
    public static void bringAppToForeground(ReactApplicationContext context) {
        try {
            if (context != null) {
                ForegroundService.moveAppToForeground(context);
                GxyLogger.d(TAG, "App brought to foreground after call");
            } else {
                GxyLogger.w(TAG, "Cannot bring app to foreground: context is null");
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error bringing app to foreground: " + e.getMessage(), e);
            Sentry.captureException(e);
        }
    }
}