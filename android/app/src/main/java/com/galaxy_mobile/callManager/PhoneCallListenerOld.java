package com.galaxy_mobile.callManager;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import com.galaxy_mobile.logger.GxyLogger;
import com.facebook.react.bridge.ReactApplicationContext;

/**
 * Call listener for Android < 13.
 *
 * Does not extend PhoneStateListener on purpose: its constructor binds to
 * Looper.myLooper() and throws on threads without a Looper. On the new
 * architecture native modules are created on a background thread, so building
 * the listener in the module constructor made GxyPackage drop every module
 * after CallListenerModule (GxyUIStateModule included). The listener is created
 * on the main thread instead.
 */
public class PhoneCallListenerOld implements ICallListener {
    private static final String TAG = "PhoneCallListenerOld";

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private TelephonyManager telephonyManager;
    private PhoneStateListener phoneStateListener;
    private CallStateCallback callback;
    private ReactApplicationContext reactContext;

    public PhoneCallListenerOld(ReactApplicationContext reactContext) {
        this.reactContext = reactContext;
    }

    @Override
    public synchronized void initialize(CallStateCallback callback) {
        this.callback = callback;
        mainHandler.post(this::registerOnMainThread);
    }

    private synchronized void registerOnMainThread() {
        try {
            if (phoneStateListener != null) {
                GxyLogger.d(TAG, "Already listening, skipping initialize");
                return;
            }

            telephonyManager = (TelephonyManager) this.reactContext.getSystemService(Context.TELEPHONY_SERVICE);
            if (telephonyManager == null) {
                throw new Exception("TelephonyManager is null");
            }

            GxyLogger.d(TAG, "TelephonyManager initialized successfully");

            phoneStateListener = new PhoneStateListener() {
                @Override
                public void onCallStateChanged(int state, String phoneNumber) {
                    PhoneCallListenerOld.this.onCallStateChanged(state, phoneNumber);
                }
            };
            telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_CALL_STATE);
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
        mainHandler.post(() -> {
            synchronized (PhoneCallListenerOld.this) {
                try {
                    if (telephonyManager != null && phoneStateListener != null) {
                        telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_NONE);
                    }
                    phoneStateListener = null;
                    GxyLogger.d(TAG, "PhoneCallListener cleaned up successfully");
                } catch (Exception e) {
                    GxyLogger.e(TAG, "Error on cleanup: " + e.getMessage());
                }
            }
        });
    }
}
