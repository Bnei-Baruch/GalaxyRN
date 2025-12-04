package com.galaxy_mobile.callManager;

import android.content.Context;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import com.galaxy_mobile.logger.GxyLogger;
import com.facebook.react.bridge.ReactApplicationContext;

public class PhoneCallListenerOld extends PhoneStateListener implements ICallListener {
    private static final String TAG = "PhoneCallListenerOld";

    private TelephonyManager telephonyManager;
    private CallStateCallback callback;
    private ReactApplicationContext reactContext;

    public PhoneCallListenerOld(ReactApplicationContext reactContext) {
        super();
        this.reactContext = reactContext;
    }

    @Override
    public synchronized void initialize(CallStateCallback callback) {
        try {
            telephonyManager = (TelephonyManager) this.reactContext.getSystemService(Context.TELEPHONY_SERVICE);
            if (telephonyManager == null) {
                throw new Exception("TelephonyManager is null");
            }

            GxyLogger.d(TAG, "TelephonyManager initialized successfully");

            telephonyManager.listen(this, PhoneStateListener.LISTEN_CALL_STATE);
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error initializing: " + e.getMessage(), e);
        }
    }

    @Override
    public void onCallStateChanged(int state, String phoneNumber) {
        try {
            callback.onCallStateChanged(state);
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error on onCallStateChanged: " + e.getMessage());
        }
    }

    @Override
    public synchronized void cleanup() {
        try {
            telephonyManager.listen(this, PhoneStateListener.LISTEN_NONE);
            GxyLogger.d(TAG, "PhoneCallListener cleaned up successfully");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error on cleanup: " + e.getMessage());
        }
    }
}