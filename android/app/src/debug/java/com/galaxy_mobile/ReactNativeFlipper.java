package com.galaxy_mobile;

import android.content.Context;
import com.facebook.flipper.android.AndroidFlipperClient;
import com.facebook.flipper.android.utils.FlipperUtils;
import com.facebook.flipper.core.FlipperClient;
import com.facebook.flipper.plugins.crashreporter.CrashReporterPlugin;
import com.facebook.flipper.plugins.databases.DatabasesFlipperPlugin;
import com.facebook.flipper.plugins.inspector.DescriptorMapping;
import com.facebook.flipper.plugins.inspector.InspectorFlipperPlugin;
import com.facebook.flipper.plugins.network.NetworkFlipperPlugin;
import com.facebook.flipper.plugins.network.FlipperOkhttpInterceptor;
import com.facebook.flipper.plugins.sharedpreferences.SharedPreferencesFlipperPlugin;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.network.NetworkingModule;
import okhttp3.OkHttpClient;

/**
 * Class responsible for initializing Flipper
 */
public class ReactNativeFlipper {
    public static void initializeFlipper(Context context, ReactInstanceManager reactInstanceManager) {
        android.util.Log.d("ReactNativeFlipper", "initializeFlipper method called");
        // Temporarily force enable Flipper for debugging
        boolean shouldEnable = FlipperUtils.shouldEnableFlipper(context);
        android.util.Log.d("ReactNativeFlipper", "FlipperUtils.shouldEnableFlipper returned: " + shouldEnable);
        android.util.Log.d("ReactNativeFlipper", "Force enabling Flipper anyway...");
        if (true) { // Force enable
            android.util.Log.d("ReactNativeFlipper", "FlipperUtils says Flipper should be enabled, creating client...");
            final FlipperClient client = AndroidFlipperClient.getInstance(context);

            android.util.Log.d("ReactNativeFlipper", "Adding plugins...");

            // Core plugins
            client.addPlugin(new InspectorFlipperPlugin(context, DescriptorMapping.withDefaults()));
            client.addPlugin(new DatabasesFlipperPlugin(context));
            client.addPlugin(new SharedPreferencesFlipperPlugin(context));
            client.addPlugin(CrashReporterPlugin.getInstance());

            // Network plugin with React Native integration
            android.util.Log.d("ReactNativeFlipper", "Adding Network plugin...");
            NetworkFlipperPlugin networkFlipperPlugin = new NetworkFlipperPlugin();
            NetworkingModule.setCustomClientBuilder(
                    new NetworkingModule.CustomClientBuilder() {
                        @Override
                        public void apply(OkHttpClient.Builder builder) {
                            builder.addNetworkInterceptor(new FlipperOkhttpInterceptor(networkFlipperPlugin));
                        }
                    });
            client.addPlugin(networkFlipperPlugin);

            android.util.Log.d("ReactNativeFlipper", "Starting Flipper client...");
            client.start();
            android.util.Log.d("ReactNativeFlipper", "Flipper client started successfully!");
        } else {
            android.util.Log.d("ReactNativeFlipper", "FlipperUtils says Flipper should NOT be enabled");
        }
    }
}
