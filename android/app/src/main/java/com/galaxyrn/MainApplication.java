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

import io.sentry.android.core.SentryAndroid;
import io.sentry.android.core.SentryAndroidOptions;

import java.lang.reflect.InvocationTargetException;
import java.util.List;
import android.content.Intent;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class MainApplication extends Application implements ReactApplication {

    private static final String TAG = "MainApplication";
    private static MainApplication instance;
    private boolean isCleaningUp = false;

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

        // Initialize Sentry
        initializeSentry();

        SoLoader.init(this, false);
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            DefaultNewArchitectureEntryPoint.load();
        }
        initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    }

    private void initializeSentry() {
        SentryAndroid.init(this, options -> {
            options.setDsn(BuildConfig.SENTRY_DSN);
            options.setDebug(BuildConfig.DEBUG);
            options.setTracesSampleRate(0.2);
            options.setProfilesSampleRate(0.1);
            options.setEnableAutoSessionTracking(true);
            options.setAttachScreenshot(true);
            options.setAttachViewHierarchy(true);
            options.setAttachStacktrace(true);
            options.setMaxBreadcrumbs(100);
            options.setSessionTrackingIntervalMillis(30000);

            if (BuildConfig.DEBUG) {
                options.setEnvironment("development");
            } else {
                options.setEnvironment("production");
            }

            options.setRelease("GalaxyRN@" + BuildConfig.VERSION_NAME + "+" + BuildConfig.VERSION_CODE);
        });
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

    @Override
    public void onTerminate() {
        GxyLogger.i(TAG, "Application terminating - performing final cleanup");
        performCleanup();
        super.onTerminate();
    }

    public static void performCleanup() {
        MainApplication app = instance;
        if (app == null || app.isCleaningUp) {
            return;
        }

        app.isCleaningUp = true;
        try {
            GxyLogger.i(TAG, "Starting application-level cleanup");

            // Stop RNBackgroundTimer first - this is critical for proper cleanup
            try {
                GxyLogger.d(TAG, "Cleaning up RNBackgroundTimer");

                // As fallback, try to send signal to JS side if still available
                if (app.getReactNativeHost() != null &&
                        app.getReactNativeHost().getReactInstanceManager() != null &&
                        app.getReactNativeHost().getReactInstanceManager().getCurrentReactContext() != null) {
                    GxyLogger.d(TAG, "Cleaning up RNBackgroundTimer");

                    try {
                        // Send cleanup signal to JS side
                        app.getReactNativeHost().getReactInstanceManager()
                                .getCurrentReactContext()
                                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                .emit("appTerminating", null);
                        GxyLogger.d(TAG, "Sent termination signal to JS side as fallback");
                    } catch (Exception e) {
                        GxyLogger.w(TAG, "Could not send termination signal to JS (this is normal during swipe-kill)",
                                e);
                    }
                }
            } catch (Exception e) {
                GxyLogger.e(TAG, "Error stopping RNBackgroundTimer", e);
            }

            // Reset audio state
            AudioManager audioManager = (AudioManager) app.getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                try {
                    audioManager.abandonAudioFocus(null);
                    audioManager.setMode(AudioManager.MODE_NORMAL);
                } catch (Exception e) {
                    GxyLogger.e(TAG, "Error resetting audio state", e);
                }
            }

            // Stop foreground service
            try {
                app.stopService(new Intent(app, ForegroundService.class));
            } catch (Exception e) {
                GxyLogger.e(TAG, "Error stopping foreground service", e);
            }

            // Flush Sentry events
            try {
                io.sentry.Sentry.flush(2000);
            } catch (Exception e) {
                GxyLogger.e(TAG, "Error flushing Sentry", e);
            }

            GxyLogger.i(TAG, "Application-level cleanup completed");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error during application cleanup", e);
        } finally {
            app.isCleaningUp = false;
        }
    }

    public static MainApplication getInstance() {
        return instance;
    }
}