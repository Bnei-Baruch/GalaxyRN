package com.galaxyrn;

import android.app.Application;
import android.content.Context;
import android.media.AudioManager;
import android.util.Log;
import com.galaxyrn.logger.GxyLogger;
import com.galaxyrn.foreground.ForegroundService;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;

import java.lang.reflect.InvocationTargetException;
import java.util.List;
import android.content.Intent;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactContext;

public class MainApplication extends Application implements ReactApplication {

    private static final String TAG = "MainApplication";
    private static MainApplication instance;
    private static boolean isCleaningUp = false;

    private final ReactNativeHost mReactNativeHost = new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            List<ReactPackage> packages = new PackageList(this).getPackages();
            packages.add(new GxyPackage());
            return packages;
        }

        @Override
        protected String getJSMainModuleName() {
            return "index";
        }

        @Override
        protected boolean isNewArchEnabled() {
            return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }

        @Override
        protected Boolean isHermesEnabled() {
            return BuildConfig.IS_HERMES_ENABLED;
        }
    };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;

        SoLoader.init(this, false);
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            DefaultNewArchitectureEntryPoint.load();
        }
        initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
        isCleaningUp = false;
    }

    /**
     * Loads Flipper in React Native templates. Call this in the onCreate method
     * with something like
     * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
     *
     * @param context
     * @param reactInstanceManager
     */
    private static void initializeFlipper(
            Context context, ReactInstanceManager reactInstanceManager) {
        if (BuildConfig.DEBUG) {
            Log.d("FlipperInit", "Starting Flipper initialization...");
            try {
                /*
                 * We use reflection here to pick up the class that initializes Flipper,
                 * since Flipper library is not available in release builds
                 */
                Class<?> aClass = Class.forName("com.galaxyrn.ReactNativeFlipper");
                Log.d("FlipperInit", "ReactNativeFlipper class found, calling initializeFlipper method...");
                aClass
                        .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
                        .invoke(null, context, reactInstanceManager);
                Log.d("FlipperInit", "Flipper initialization completed successfully!");
            } catch (ClassNotFoundException e) {
                Log.e("FlipperInit", "ClassNotFoundException: ReactNativeFlipper class not found", e);
                e.printStackTrace();
            } catch (NoSuchMethodException e) {
                Log.e("FlipperInit", "NoSuchMethodException: initializeFlipper method not found", e);
                e.printStackTrace();
            } catch (IllegalAccessException e) {
                Log.e("FlipperInit", "IllegalAccessException: Cannot access initializeFlipper method", e);
                e.printStackTrace();
            } catch (InvocationTargetException e) {
                Log.e("FlipperInit", "InvocationTargetException: Error calling initializeFlipper method", e);
                e.printStackTrace();
            }
        } else {
            Log.d("FlipperInit", "Skipping Flipper initialization in release build");
        }
    }

    public static MainApplication getInstance() {
        return instance;
    }

    public static void performCleanup() {
        if (isCleaningUp) {
            return;
        }
        isCleaningUp = true;

        GxyLogger.i(TAG, "Starting cleanup");

        // 1. Notify JS side and destroy React Native context
        try {
            if (instance != null && instance.getReactNativeHost() != null) {
                ReactInstanceManager rim = instance.getReactNativeHost().getReactInstanceManager();
                if (rim != null) {
                    try {
                        ReactContext reactContext = rim.getCurrentReactContext();
                        if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
                            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                    .emit("appTerminating", null);
                            GxyLogger.d(TAG, "Sent termination signal to JS - Activity status: irrelevant");
                            Thread.sleep(1000);
                        } else {
                            GxyLogger.w(TAG, "React context is null or no active");
                        }
                    } catch (Exception jsError) {
                        GxyLogger.w(TAG, "Could not send JS signal (normal during swipe-kill)", jsError);
                    }

                    GxyLogger.i(TAG, "Destroying React Native context");
                    rim.destroy();
                }
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error destroying React Native context", e);
        }

        // 2. Reset audio state
        try {
            AudioManager am = (AudioManager) instance.getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                am.abandonAudioFocus(null);
                am.setMode(AudioManager.MODE_NORMAL);
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error resetting audio", e);
        }

        // 3. Flush Sentry
        try {
            io.sentry.Sentry.flush(1000); // Reduced timeout
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error flushing Sentry", e);
        }

        // 4. Force cleanup system resources
        try {
            GxyLogger.i(TAG, "Forcing garbage collection");
            System.gc();
            System.runFinalization();

            Thread.sleep(500);

            GxyLogger.i(TAG, "Cleanup completed - terminating process");

            // More aggressive process termination
            android.os.Process.killProcess(android.os.Process.myPid());
            System.exit(0);

        } catch (Exception e) {
            GxyLogger.e(TAG, "Error during final cleanup", e);
            System.exit(1);
        }
    }
}