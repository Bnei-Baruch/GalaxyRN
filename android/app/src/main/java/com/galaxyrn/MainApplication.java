package com.galaxyrn;

import android.app.Application;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactHost;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;

import java.util.List;

import io.sentry.android.core.SentryAndroid;

public class MainApplication extends Application implements ReactApplication {

    private final ReactNativeHost reactNativeHost = new DefaultReactNativeHost(this) {
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
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
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
        return reactNativeHost;
    }

    @Override
    public ReactHost getReactHost() {
        return DefaultReactHost.getDefaultReactHost(getApplicationContext(), reactNativeHost);
    }

    @Override
    public void onCreate() {
        super.onCreate();

        ReactContext reactContext = new ReactContext(this);
        SentryAndroid.init(this, sentryOpts -> {
            sentryOpts.setDsn(BuildConfig.SENTRY_DSN);
            sentryOpts.setDebug(BuildConfig.DEBUG);
            sentryOpts.setTracesSampleRate(0.2);
            sentryOpts.setProfilesSampleRate(0.1);
            sentryOpts.setEnableAutoSessionTracking(true);
            sentryOpts.setAttachScreenshot(true);
            sentryOpts.setAttachViewHierarchy(true);
            sentryOpts.setAttachStacktrace(true);
            sentryOpts.setMaxBreadcrumbs(100);
            sentryOpts.setSessionTrackingIntervalMillis(30000);

            // Set environment based on build type
            if (BuildConfig.DEBUG) {
                sentryOpts.setEnvironment("development");
            } else {
                sentryOpts.setEnvironment("production");
            }

            sentryOpts.setRelease("GalaxyRN@" + BuildConfig.VERSION_NAME + "+" + BuildConfig.VERSION_CODE);
        });
        SoLoader.init(this, false);

        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            DefaultNewArchitectureEntryPoint.load();
        }
    }

    @Override
    public void onTerminate() {
        super.onTerminate();

        io.sentry.Sentry.flush(2000);
    }
}