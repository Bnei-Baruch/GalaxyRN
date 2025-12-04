package com.galaxy_mobile.callManager;

import com.galaxy_mobile.logger.GxyLogger;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.galaxy_mobile.SendEventToClient;
import android.telephony.TelephonyManager;

public class CallEventManager {
    private static final String TAG = "CallEventManager";


    public static void dispatchCallStateEvent(int state) {
        String stateString = getStateString(state);
        GxyLogger.d(TAG, "dispatchCallStateEvent() called with state: " + stateString);
        try {
            WritableMap data = Arguments.createMap();
            data.putString("state", stateString);
            SendEventToClient.sendEvent("onCallStateChanged", data);
            GxyLogger.d(TAG, "SendEventToClient.sendEvent() completed for state: " + stateString);
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error in dispatchCallStateEvent for state " + stateString + ": " + e.getMessage(), e);
        }
    }

    private static String getStateString(int state) {
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