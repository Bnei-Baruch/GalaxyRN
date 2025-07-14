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

import java.util.List;
import android.content.Intent;

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