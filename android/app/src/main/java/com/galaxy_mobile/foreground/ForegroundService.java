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
    public static volatile boolean isRunning = false;

    public static final String START_SERVICE_ACTION = "START_SERVICE";
    public static final String STOP_SERVICE_ACTION = "STOP_SERVICE";
    public static final String MIC_STATE_EXTRA = "MIC_STATE";

    private boolean mIsMicOn = false;

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        GxyLogger.i(TAG, "onCreate");
        PlayerNotification.initChannel(getApplicationContext());
        GxyLogger.i(TAG, "onCreate completed");
        isRunning = true;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent.getAction();
        GxyLogger.i(TAG, "onStartCommand: " + action);

        if (action.equals(STOP_SERVICE_ACTION)) {
            stop();
            return START_NOT_STICKY;
        }

        boolean isMicOn = false;
        if (action.equals(START_SERVICE_ACTION)) {
            isMicOn = intent.getBooleanExtra(ForegroundService.MIC_STATE_EXTRA, false);
            start(isMicOn);
            return START_STICKY;
        }
        GxyLogger.e(TAG, "Invalid action: " + action);
        return START_NOT_STICKY;
    }

    private void start(boolean isMicOn) {
        GxyLogger.i(TAG, "Starting foreground service with isMicOn: " + isMicOn);
        PlayerNotification notification = new PlayerNotification(getApplicationContext());
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                int serviceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK;
                StringBuilder typesLog = new StringBuilder("Starting with MEDIA_PLAYBACK");

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && isMicOn) {
                    serviceType |= ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
                    typesLog.append(" + MICROPHONE");
                }

                // Add CONNECTED_DEVICE type for Bluetooth/USB audio devices (Android 14+)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    serviceType |= ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE;
                    typesLog.append(" + CONNECTED_DEVICE");
                }

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
    }

    public void stop() {
        GxyLogger.i(TAG, "Stopping foreground service.");
        cleanup();
        stopSelf();
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
        isRunning = false;
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
}
