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

    public static MainApplication getInstance() {
        return instance;
    }
}