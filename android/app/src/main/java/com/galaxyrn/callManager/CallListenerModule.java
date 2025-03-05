

package com.galaxyrn.callManager;

import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

@RequiresApi(api = Build.VERSION_CODES.M)
public class CallListenerModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    private final String TAG = "CallListenerModule";
    private final ReactApplicationContext context;
    private PhoneCallListener phoneCallListener;

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

        Log.d(TAG, "initialize called" + context.getPackageName());
    }

    @Override
    public void onHostResume() {
        Log.d(TAG, "onHostResume()");
        phoneCallListener = new PhoneCallListener(context);
    }

    @Override
    public void onHostPause() {

        Log.d(TAG, "onHostPause()");
    }

    @Override
    public void onHostDestroy() {
        Log.d(TAG, "onHostDestroy()");
        phoneCallListener.cleanCallListener();
    }
}

