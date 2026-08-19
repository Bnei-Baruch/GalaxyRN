package com.galaxy_mobile.foreground;

import android.app.Notification;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.IBinder;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.galaxy_mobile.MainApplication;
import com.galaxy_mobile.uiState.GxyUIStateModule;
import com.galaxy_mobile.logger.GxyLogger;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;

public class ForegroundService extends Service {
    private static final String TAG = "ForegroundService";
    public static volatile boolean isRunning = false;
    private PlayerNotificationBuilder notificationBuilder;
    private WifiManager.WifiLock wifiLock;

    public static final String START_SERVICE_ACTION = "START_SERVICE";
    public static final String STOP_SERVICE_ACTION = "STOP_SERVICE";

    public static final String MIC_STATE_EXTRA = "MIC_STATE";
    public static final String IN_ROOM_EXTRA = "IN_ROOM_EXTRA";
    public static final String ROOM_EXTRA = "ROOM_EXTRA";
    public static final String UPDATE_SERVICE_EXTRA = "UPDATE_SERVICE";

    public static String room = "Not in room";

    private final BroadcastReceiver screenReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (Intent.ACTION_SCREEN_OFF.equals(intent.getAction())) {
                WritableMap params = Arguments.createMap();
                params.putString("action", "screen_off");
                GxyUIStateModule.dispatchSystemEvent(params);
            }
        }
    };

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        GxyLogger.i(TAG, "onCreate");
        notificationBuilder = new PlayerNotificationBuilder(getApplicationContext());

        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        registerReceiver(screenReceiver, filter);
        isRunning = true;
        GxyLogger.i(TAG, "onCreate completed");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            GxyLogger.w(TAG, "onStartCommand: null intent (system restart), returning START_STICKY");
            return START_STICKY;
        }
        String action = intent.getAction();
        GxyLogger.i(TAG, "onStartCommand: " + action);

        if (STOP_SERVICE_ACTION.equals(action)) {
            stop();
            return START_NOT_STICKY;
        }
        if (START_SERVICE_ACTION.equals(action)) {
            start();
            return START_STICKY;
        }
        GxyLogger.d(TAG, "Invalid action: " + action);
        return START_NOT_STICKY;
    }

    private void start() {
        GxyLogger.i(TAG, "Starting foreground service");

        Notification notification = notificationBuilder.build();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                int serviceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK;
                StringBuilder typesLog = new StringBuilder("Starting with MEDIA_PLAYBACK");

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    serviceType |= ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
                    typesLog.append(" + MICROPHONE");
                }

                // Add CONNECTED_DEVICE type for Bluetooth/USB audio devices (Android 14+)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    serviceType |= ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE;
                    typesLog.append(" + CONNECTED_DEVICE");
                }

                startForeground(PlayerNotificationBuilder.NOTIFICATION_ID, notification, serviceType);
                GxyLogger.i(TAG, "Successfully started as foreground service");
            } else {
                startForeground(PlayerNotificationBuilder.NOTIFICATION_ID, notification);
                GxyLogger.i(TAG, "Successfully started as foreground service (legacy)");
            }

            acquireWifiLock();
            GxyLogger.i(TAG, "Foreground service ready");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error starting foreground", e);
        }
    }

    private void acquireWifiLock() {
        try {
            WifiManager wifiManager = (WifiManager) getApplicationContext()
                    .getSystemService(Context.WIFI_SERVICE);
            if (wifiLock == null) {
                wifiLock = wifiManager.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "GalaxyRN:WifiLock");
            }
            if (!wifiLock.isHeld()) {
                wifiLock.acquire();
                GxyLogger.i(TAG, "WifiLock acquired");
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error acquiring WifiLock", e);
        }
    }

    private void releaseWifiLock() {
        try {
            if (wifiLock != null && wifiLock.isHeld()) {
                wifiLock.release();
                GxyLogger.i(TAG, "WifiLock released");
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error releasing WifiLock", e);
        }
    }

    public void stop() {
        GxyLogger.i(TAG, "Stopping foreground service.");
        cleanup();
        stopSelf();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        GxyLogger.i(TAG, "onTaskRemoved - app swiped away from recent tasks");

        try {
            // cleanup on swipe close from background
            MainApplication app = MainApplication.getInstance();
            if (app != null) {
                GxyLogger.i(TAG, "Performing MainApplication cleanup");
                MainApplication.performCleanup();
            }

            cleanup();
            stopSelf();
            GxyLogger.i(TAG, "onTaskRemoved completed");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error in onTaskRemoved", e);
            stopSelf();
        }
    }

    @Override
    public void onDestroy() {
        GxyLogger.i(TAG, "onDestroy");
        cleanup();
        isRunning = false;
        super.onDestroy();
    }

    private void cleanup() {
        releaseWifiLock();

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE);
            } else {
                stopForeground(true);
            }
            GxyLogger.d(TAG, "Foreground service cleanup completed");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error during cleanup", e);
        }

        try {
            unregisterReceiver(screenReceiver);
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error unregistering screen receiver", e);
        }
    }

    public static void bringAppToForeground(Context context) {
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            context.startActivity(launchIntent);
        }
    }
}
