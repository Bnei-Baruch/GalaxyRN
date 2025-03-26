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

public class PhoneCallListener extends PhoneStateListener {
    private static final String TAG = "PhoneCallListener";
    private ReactApplicationContext context;
    private boolean isInitialized = false;

    public synchronized void init(ReactApplicationContext context) {
        if (isInitialized) {
            Log.d(TAG, "PhoneCallListener already initialized");
            return;
        }

        try {
            if (context == null) {
                Log.e(TAG, "Context is null during initialization");
                return;
            }

            TelephonyManager telephonyManager = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
            if (telephonyManager == null) {
                Log.e(TAG, "TelephonyManager is null");
                return;
            }

            this.context = context;
            telephonyManager.listen(this, PhoneStateListener.LISTEN_CALL_STATE);
            isInitialized = true;
            Log.d(TAG, "PhoneCallListener initialized successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error initializing PhoneCallListener: " + e.getMessage());
            Sentry.captureException(e);
        }
    }

    @Override
    public void onCallStateChanged(int state, String phoneNumber) {
        if (!isInitialized) {
            Log.w(TAG, "PhoneCallListener not initialized, ignoring call state change");
            return;
        }

        try {
            switch (state) {
                case TelephonyManager.CALL_STATE_RINGING, TelephonyManager.CALL_STATE_OFFHOOK:
                    sendEvent(CallStateType.ON_START_CALL);
                    break;

                case TelephonyManager.CALL_STATE_IDLE:
                    sendEvent(CallStateType.ON_END_CALL);
                    if (context != null) {
                        ForegroundService.moveAppToForeground(this.context);
                    }
                    break;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onCallStateChanged: " + e.getMessage());
            Sentry.captureException(e);
        }
    }

    public synchronized void cleanCallListener() {
        if (!isInitialized || context == null) {
            Log.d(TAG, "PhoneCallListener not initialized or context is null, skipping cleanup");
            return;
        }

        try {
            TelephonyManager telephonyManager = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
            if (telephonyManager == null) {
                Log.e(TAG, "TelephonyManager is null during cleanup");
                return;
            }
            telephonyManager.listen(null, PhoneStateListener.LISTEN_CALL_STATE);
            isInitialized = false;
            context = null;
            Log.d(TAG, "PhoneCallListener cleaned up successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error while cleaning call listener: " + e.getMessage());
            Sentry.captureException(e);
        }
    }

    public static void sendEvent(CallStateType state) {
        try {
            WritableMap data = Arguments.createMap();
            data.putString("state", state.name());
            SendEventToClient.sendEvent("onCallStateChanged", data);
        } catch (Exception e) {
            Log.e(TAG, "Error sending event: " + e.getMessage());
            Sentry.captureException(e);
        }
    }
}