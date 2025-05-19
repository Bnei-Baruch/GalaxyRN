package com.galaxyrn.callManager;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.galaxyrn.SendEventToClient;
import com.galaxyrn.foreground.ForegroundService;

import io.sentry.Sentry;

/**
 * Manages and dispatches call events to JavaScript layer.
 * Handles bringing the app to foreground after calls.
 */
public class CallEventManager {
    private static final String TAG = "CallEventManager";
    
    /**
     * Dispatches a call state event to the JavaScript layer
     * @param state The call state to dispatch
     */
    public static void dispatchCallStateEvent(CallStateType state) {
        try {
            WritableMap data = Arguments.createMap();
            data.putString("state", state.name());
            SendEventToClient.sendEvent("onCallStateChanged", data);
            Log.d(TAG, "Dispatched call state event: " + state.name());
        } catch (Exception e) {
            Log.e(TAG, "Error sending event: " + e.getMessage(), e);
            Sentry.captureException(e);
        }
    }
    
    /**
     * Brings the application to foreground after a call ends
     * @param context The React application context
     */
    public static void bringAppToForeground(ReactApplicationContext context) {
        try {
            if (context != null) {
                ForegroundService.moveAppToForeground(context);
                Log.d(TAG, "App brought to foreground after call");
            } else {
                Log.w(TAG, "Cannot bring app to foreground: context is null");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error bringing app to foreground: " + e.getMessage(), e);
            Sentry.captureException(e);
        }
    }
} 