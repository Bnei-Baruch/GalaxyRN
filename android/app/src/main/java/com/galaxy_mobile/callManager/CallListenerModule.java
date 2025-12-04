package com.galaxy_mobile.callManager;

import android.os.Build;
import com.galaxy_mobile.logger.GxyLogger;
import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.bridge.ReactMethod;
import com.galaxy_mobile.foreground.ForegroundService;
import android.telephony.TelephonyManager;

@ReactModule(name = CallListenerModule.NAME)
public class CallListenerModule extends ReactContextBaseJavaModule {
    public static final String NAME = "CallListenerModule";
    private static final String TAG = NAME;

    private final ReactApplicationContext context;
    private ICallListener callListener;

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

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }
    

    public void initializeAfterPermissions() {
        CallStateCallback callback = (state) -> {
            try {
                GxyLogger.d(TAG, "Call state changed: " + state);
                CallEventManager.dispatchCallStateEvent(state);
                if(TelephonyManager.CALL_STATE_IDLE == state) {
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
