package com.galaxyrn.callManager;

import android.content.Context;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.galaxyrn.SendEventToClient;
import com.galaxyrn.foreground.ForegroundService;
import io.sentry.Sentry;

/**
 * Phone call listener that monitors call state changes and triggers appropriate events.
 * Implemented as a singleton to ensure only one instance is active at a time.
 */
public class PhoneCallListener extends PhoneStateListener implements ICallListener {
    private static final String TAG = "PhoneCallListener";
    
    // Singleton instance
    private static PhoneCallListener instance;
    
    private ReactApplicationContext context;
    private boolean isInitialized = false;
    private TelephonyManager telephonyManager;
    
    /**
     * Private constructor to enforce singleton pattern
     */
    private PhoneCallListener() {
        // Private constructor for singleton
    }
    
    /**
     * Get the singleton instance of the PhoneCallListener
     * @return The singleton instance
     */
    public static synchronized PhoneCallListener getInstance() {
        if (instance == null) {
            instance = new PhoneCallListener();
        }
        return instance;
    }

    /**
     * Initialize the phone call listener with the provided context
     * @param context ReactApplicationContext to use for initialization
     * @return true if initialization was successful, false otherwise
     */
    @Override
    public synchronized boolean initialize(ReactApplicationContext context) {
        if (isInitialized) {
            Log.d(TAG, "PhoneCallListener already initialized");
            return true;
        }

        try {
            if (context == null) {
                Log.e(TAG, "Context is null during initialization");
                return false;
            }

            telephonyManager = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
            if (telephonyManager == null) {
                Log.e(TAG, "TelephonyManager is null");
                return false;
            }

            this.context = context;
            telephonyManager.listen(this, PhoneStateListener.LISTEN_CALL_STATE);
            isInitialized = true;
            Log.d(TAG, "PhoneCallListener initialized successfully");
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error initializing PhoneCallListener: " + e.getMessage(), e);
            Sentry.captureException(e);
            return false;
        }
    }

    @Override
    public void onCallStateChanged(int state, String phoneNumber) {
        if (!isInitialized) {
            Log.w(TAG, "PhoneCallListener not initialized, ignoring call state change");
            return;
        }

        try {
            Log.d(TAG, "Call state changed to: " + getStateString(state));
            
            switch (state) {
                case TelephonyManager.CALL_STATE_RINGING:
                    CallEventManager.dispatchCallStateEvent(CallStateType.ON_RINGING);
                    CallEventManager.dispatchCallStateEvent(CallStateType.ON_START_CALL);
                    break;

                case TelephonyManager.CALL_STATE_OFFHOOK:
                    CallEventManager.dispatchCallStateEvent(CallStateType.ON_OFFHOOK);
                    CallEventManager.dispatchCallStateEvent(CallStateType.ON_START_CALL);
                    break;

                case TelephonyManager.CALL_STATE_IDLE:
                    CallEventManager.dispatchCallStateEvent(CallStateType.ON_END_CALL);
                    if (context != null) {
                        CallEventManager.bringAppToForeground(context);
                    }
                    break;
                    
                default:
                    CallEventManager.dispatchCallStateEvent(CallStateType.UNKNOWN);
                    break;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onCallStateChanged: " + e.getMessage(), e);
            Sentry.captureException(e);
        }
    }
    
    /**
     * Convert call state integer to string for logging
     */
    private String getStateString(int state) {
        switch (state) {
            case TelephonyManager.CALL_STATE_RINGING: return "RINGING";
            case TelephonyManager.CALL_STATE_OFFHOOK: return "OFFHOOK";
            case TelephonyManager.CALL_STATE_IDLE: return "IDLE";
            default: return "UNKNOWN (" + state + ")";
        }
    }

    /**
     * Clean up listener resources and stop monitoring calls
     */
    @Override
    public synchronized void cleanup() {
        if (!isInitialized || context == null) {
            Log.d(TAG, "PhoneCallListener not initialized or context is null, skipping cleanup");
            return;
        }

        try {
            if (telephonyManager == null) {
                Log.e(TAG, "TelephonyManager is null during cleanup");
                return;
            }
            
            telephonyManager.listen(this, PhoneStateListener.LISTEN_NONE);
            isInitialized = false;
            telephonyManager = null;
            context = null;
            Log.d(TAG, "PhoneCallListener cleaned up successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error while cleaning call listener: " + e.getMessage(), e);
            Sentry.captureException(e);
        }
    }
    
    /**
     * Check if the listener is currently initialized
     * @return true if initialized, false otherwise
     */
    @Override
    public boolean isInitialized() {
        return isInitialized;
    }
}