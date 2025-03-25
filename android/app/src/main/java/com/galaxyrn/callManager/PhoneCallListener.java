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
    ReactApplicationContext context;

    public void init(ReactApplicationContext context) {
        TelephonyManager telephonyManager = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
        telephonyManager.listen(this, PhoneStateListener.LISTEN_CALL_STATE);

        this.context = context;
    }

    @Override
    public void onCallStateChanged(int state, String phoneNumber) {
        switch (state) {
            case TelephonyManager.CALL_STATE_RINGING, TelephonyManager.CALL_STATE_OFFHOOK:
                sendEvent(CallStateType.ON_START_CALL);
                break;

            case TelephonyManager.CALL_STATE_IDLE:
                sendEvent(CallStateType.ON_END_CALL);
                ForegroundService.moveAppToForeground(this.context);
                break;
        }
    }

    public void cleanCallListener() {
        if (context == null) {
            return;
        }

        try {
            TelephonyManager telephonyManager = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
            if (telephonyManager == null) {
                return;
            }
            telephonyManager.listen(null, PhoneStateListener.LISTEN_CALL_STATE);
        } catch (Exception e) {
            Log.e(TAG, "Error while cleaning call listener: " + e.getMessage());
            Sentry.captureException(e);
        }
    }

    public static void sendEvent(CallStateType state) {
        WritableMap data = Arguments.createMap();
        data.putString("state", state.name());
        SendEventToClient.sendEvent("onCallStateChanged", data);
    }
}