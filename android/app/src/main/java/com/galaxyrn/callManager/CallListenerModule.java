package com.galaxyrn.callManager;

import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import io.sentry.Sentry;

@RequiresApi(api = Build.VERSION_CODES.M)
public class CallListenerModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    private static final String TAG = "CallListenerModule";
    private final ReactApplicationContext context;
    private PhoneCallListener phoneCallListener;
    private boolean isInitialized = false;

    public CallListenerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        context = reactContext;
        reactContext.addLifecycleEventListener(this);
    }

    @NonNull
    @Override
    public String getName() {
        return TAG;
    }

    @Override
    public void initialize() {
        super.initialize();

        try {
            Log.d(TAG, "initialize called for package: " + context.getPackageName());
            if (!isInitialized) {
                phoneCallListener = new PhoneCallListener();
                phoneCallListener.init(context);
                isInitialized = true;
                Log.d(TAG, "CallListenerModule initialized successfully");
            } else {
                Log.d(TAG, "CallListenerModule already initialized");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in initialize(): " + e.getMessage(), e);
            Sentry.captureException(e);
        }
    }

    @Override
    public void onHostResume() {
        Log.d(TAG, "onHostResume()");
        if (!isInitialized) {
            initialize();
        }
    }

    @Override
    public void onHostPause() {
        Log.d(TAG, "onHostPause()");
    }

    @Override
    public void onHostDestroy() {
        Log.d(TAG, "onHostDestroy()");
        try {
            if (phoneCallListener != null) {
                phoneCallListener.cleanCallListener();
                phoneCallListener = null;
            }
            isInitialized = false;
            Log.d(TAG, "CallListenerModule cleaned up successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error in onHostDestroy(): " + e.getMessage(), e);
            Sentry.captureException(e);
        }
    }
}
