package com.galaxyrn;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "GalaxyRN";
    }

    /**
     * Returns the instance of the ReactActivityDelegate.
     * We use DefaultReactActivityDelegate which allows enabling the New Architecture
     * with a single boolean flag fabricEnabled.
     */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(this, getMainComponentName(), false);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        if (getReactInstanceManager() != null) {
            ReactContext reactContext = getReactInstanceManager().getCurrentReactContext();
            if (reactContext != null) {
                reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("AppTerminated", null);
            }
        }
    }
}