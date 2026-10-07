package com.galaxy_mobile.callManager;

import android.os.Build;
import com.galaxy_mobile.logger.GxyLogger;

import com.facebook.fbreact.specs.NativeCallListenerModuleSpec;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.galaxy_mobile.foreground.ForegroundService;
import com.galaxy_mobile.permissions.PermissionAware;
import android.telephony.TelephonyManager;

@ReactModule(name = CallListenerModule.NAME)
public class CallListenerModule extends NativeCallListenerModuleSpec implements PermissionAware {
    private static final String TAG = NAME;

    private final ReactApplicationContext context;
    private ICallListener callListener;
    private int lastCallState = TelephonyManager.CALL_STATE_IDLE;

    public CallListenerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        GxyLogger.d(TAG, "CallListenerModule constructor called");
        context = reactContext;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            callListener = new PhoneCallListenerTiramisu(context);
        } else {
            callListener = new PhoneCallListenerOld(context);
        }
    }

    @Override
    public void onPermissionsGranted() {
        initializeAfterPermissions();
    }

    public void initializeAfterPermissions() {
        CallStateCallback callback = (state) -> {
            try {
                GxyLogger.d(TAG, "Call state changed: " + CallEventManager.getStateString(state));
                boolean wasIdle = lastCallState == TelephonyManager.CALL_STATE_IDLE;
                boolean isIdle = state == TelephonyManager.CALL_STATE_IDLE;
                lastCallState = state;

                // JS (inits.js) expects the same events as iOS CallManager:
                // ON_START_CALL when a call rings/connects, ON_END_CALL when it ends.
                // Only transitions are reported - the listener also delivers the
                // current state (IDLE) right after registering, and RINGING ->
                // OFFHOOK is the same call.
                CallStateType event;
                if (wasIdle && !isIdle) {
                    event = CallStateType.ON_START_CALL;
                } else if (!wasIdle && isIdle) {
                    event = CallStateType.ON_END_CALL;
                } else {
                    return;
                }

                WritableMap data = Arguments.createMap();
                data.putString("state", event.name());
                emitOnCallStateChanged(data);
                GxyLogger.d(TAG, "Emitted " + event.name());

                if (event == CallStateType.ON_END_CALL) {
                    ForegroundService.bringAppToForeground(context);
                }
            } catch (Exception e) {
                GxyLogger.e(TAG, "Error on onCallStateChanged: " + e.getMessage());
            }
        };

        GxyLogger.d(TAG, "Initializing callListener");
        try {
            callListener.initialize(callback);
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error on initializeCallListener: " + e.getMessage());
        }
    }

    public void cleanup() {
        GxyLogger.d(TAG, "cleanup()");
        if (callListener == null) {
            GxyLogger.d(TAG, "callListener is null, skipping cleanup");
            return;
        }
        try {
            callListener.cleanup();
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error on cleanup: " + e.getMessage());
        }
    }
}
