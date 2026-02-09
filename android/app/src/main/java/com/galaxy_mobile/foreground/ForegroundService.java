package com.galaxy_mobile.foreground;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import com.galaxy_mobile.logger.GxyLogger;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import com.galaxy_mobile.R;
import com.galaxy_mobile.MainApplication;
import com.galaxy_mobile.foreground.PlayerNotification;
import com.galaxy_mobile.foreground.PlayerActionReceiver;
import com.galaxy_mobile.logger.GxyLogger;
import com.facebook.react.bridge.ReactApplicationContext;

public class ForegroundService extends Service {
    private static final String TAG = "ForegroundService";
    public static final String APP_TO_FOREGROUND_ACTION = "APP_TO_FOREGROUND";

    private boolean mIsMicOn = false;
    public static boolean isActive = true;
    private PlayerNotification notification;

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        GxyLogger.i(TAG, "ForegroundService: onCreate");
        PlayerNotification.initChannel(getApplicationContext());
    }

    public void start() {
        GxyLogger.i(TAG, "Starting foreground service. Service started: " + mIsMicOn);
        Context context = getApplicationContext();

        Intent intent = new Intent(context, ForegroundService.class);
        intent.setAction(APP_TO_FOREGROUND_ACTION);

        GxyLogger.d(TAG, "Starting foreground service");

        try {
            ComponentName cn = context.startForegroundService(intent);
            if (cn == null) {
                GxyLogger.w(TAG, "Foreground service not started");
            } else {
                GxyLogger.i(TAG, "Foreground service started successfully");
            }
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error starting foreground service", e);
        }
    }

    public void stop() {
        GxyLogger.i(TAG, "Stopping foreground service.");
        cleanup();
        stopSelf();
    }

    public void setMicOn() {
        GxyLogger.i(TAG, "setMicOn called");
        mIsMicOn = true;
        start();
    }

    public void setMicOff() {
        GxyLogger.i(TAG, "setMicOff called");
        mIsMicOn = false;
        stop();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        GxyLogger.i(TAG, "onStartCommand" + intent.getAction());
        Context context = getApplicationContext();
        notification = new PlayerNotification(context);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                int serviceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK;
                StringBuilder typesLog = new StringBuilder("Starting with MEDIA_PLAYBACK");

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && mIsMicOn) {
                    serviceType |= ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
                    typesLog.append(" + MICROPHONE");
                }

                // Add CONNECTED_DEVICE type for Bluetooth/USB audio devices (Android 14+)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    serviceType |= ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE;
                    typesLog.append(" + CONNECTED_DEVICE");
                }

                GxyLogger.i(TAG, typesLog.toString());
                startForeground(PlayerNotification.NOTIFICATION_ID, notification.getNotification(), serviceType);
                GxyLogger.i(TAG, "Successfully started as foreground service");
            } else {
                startForeground(PlayerNotification.NOTIFICATION_ID, notification.getNotification());
                GxyLogger.i(TAG, "Successfully started as foreground service (legacy)");
            }

            GxyLogger.i(TAG, "Foreground service ready");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error starting foreground", e);
        }
        return START_NOT_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        GxyLogger.i(TAG, "ForegroundService: onTaskRemoved - app swiped away from recent tasks");

        try {
            // cleanup on swipe close from background
            MainApplication app = MainApplication.getInstance();
            if (app != null) {
                GxyLogger.i(TAG, "Performing MainApplication cleanup");
                MainApplication.performCleanup();
            }

            cleanup();
            stopSelf();
            GxyLogger.i(TAG, "ForegroundService: onTaskRemoved completed");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error in onTaskRemoved", e);
            stopSelf();
        }
    }

    @Override
    public void onDestroy() {
        GxyLogger.i(TAG, "ForegroundService: onDestroy");
        cleanup();
        super.onDestroy();
    }

    private void cleanup() {
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
    }

    public static void moveAppToForeground(ReactApplicationContext context) {
        if (isActive) {
            GxyLogger.w(TAG, "App is already in foreground, skipping move to foreground");
            return;
        }
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            context.startActivity(launchIntent);
        }
    }
}
