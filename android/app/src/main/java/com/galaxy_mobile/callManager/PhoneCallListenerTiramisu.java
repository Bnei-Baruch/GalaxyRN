package com.galaxy_mobile.callManager;

import android.content.Context;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import com.galaxy_mobile.logger.GxyLogger;
import android.telephony.TelephonyCallback;
import android.os.Looper;
import com.facebook.react.bridge.ReactApplicationContext;
import android.os.Build;
import androidx.annotation.RequiresApi;



@RequiresApi(api = Build.VERSION_CODES.TIRAMISU)
public class PhoneCallListenerTiramisu extends TelephonyCallback implements ICallListener {
    private static final String TAG = "PhoneCallListenerTiramisu";

    private TelephonyManager telephonyManager;
    private CallStateCallback callback;
    private ReactApplicationContext reactContext;
    
    public PhoneCallListenerTiramisu(ReactApplicationContext reactContext) {
        super();
        this.reactContext = reactContext;
    }

    @Override
    public synchronized void initialize(CallStateCallback callback) {
        this.callback = callback;
        try {
            telephonyManager = (TelephonyManager) this.reactContext.getSystemService(Context.TELEPHONY_SERVICE);
            if (telephonyManager == null) {
                throw new Exception("TelephonyManager is null");
            }

            GxyLogger.d(TAG, "TelephonyManager initialized successfully");

            telephonyManager.registerTelephonyCallback(this.reactContext.getMainExecutor(), this);
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error initializing: " + e.getMessage(), e);
        }
    }

    @Override
    public void onCallStateChanged(int state, String phoneNumber) {
        try {
            GxyLogger.d(TAG, "Call state changed: " + state);
            callback.onCallStateChanged(state);
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error on onCallStateChanged: " + e.getMessage());
        }
    }

    @Override
    public synchronized void cleanup() {
        try {
            telephonyManager.unregisterTelephonyCallback(this);
            GxyLogger.d(TAG, "PhoneCallListener cleaned up successfully");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error on cleanup: " + e.getMessage());
        }
    }
}