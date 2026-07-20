package com.galaxy_mobile.callManager;

import android.telephony.TelephonyManager;

public class CallEventManager {

    public static String getStateString(int state) {
        switch (state) {
            case TelephonyManager.CALL_STATE_RINGING:
                return "RINGING";
            case TelephonyManager.CALL_STATE_OFFHOOK:
                return "OFFHOOK";
            case TelephonyManager.CALL_STATE_IDLE:
                return "IDLE";
            default:
                return "UNKNOWN (" + state + ")";
        }
    }
}