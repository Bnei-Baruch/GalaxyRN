package com.galaxyrn.callManager;


import android.content.Context;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.galaxyrn.SendEventToClient;

public class PhoneCallListener extends PhoneStateListener {
    TelephonyManager telephonyManager;

    public PhoneCallListener(ReactApplicationContext context) {
        telephonyManager = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
        telephonyManager.listen(this, PhoneStateListener.LISTEN_CALL_STATE);
    }

    @Override
    public void onCallStateChanged(int state, String phoneNumber) {
        switch (state) {
            case TelephonyManager.CALL_STATE_RINGING, TelephonyManager.CALL_STATE_OFFHOOK:
                sendEvent(CallStateType.ON_START_CALL);
                break;

            case TelephonyManager.CALL_STATE_IDLE:
                sendEvent(CallStateType.ON_END_CALL);
                break;
        }
    }

    public void cleanCallListener() {
        telephonyManager.listen(null, PhoneStateListener.LISTEN_CALL_STATE);
        telephonyManager = null;
    }

    public static void sendEvent(CallStateType state) {
        WritableMap data = Arguments.createMap();
        data.putString("state", state.name());
        SendEventToClient.sendEvent("onCallStateChanged", data);
    }
}