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

public class ForegroundService extends Service {
    private static final String TAG = "ForegroundService";
    private static final int NOTIFICATION_ID = 9999;
    private static final String NOTIFICATION_CHANNEL_ID = "GxyNotificationChannel";
    public static final String APP_TO_FOREGROUND_ACTION = "APP_TO_FOREGROUND";

    private static boolean mIsServiceStarted = false;
    private static boolean mIsMicOn = false;
    private static ForegroundService sInstance;
    private static long lastStartRequestTime = 0;
    private static final long MIN_START_INTERVAL_MS = 1000; // Minimum 1 second between start requests

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        sInstance = this;
        GxyLogger.i(TAG, "ForegroundService: onCreate");
    }

    public void start(@NonNull Context context) {
        GxyLogger.i(TAG, "Starting foreground service. Service started: " + ForegroundService.mIsServiceStarted);

        // Check if service already started
        if (ForegroundService.mIsServiceStarted) {
            GxyLogger.d(TAG, "Foreground service already started");
            return;
        }

        // Prevent rapid repeated start requests (debouncing)
        long currentTime = System.currentTimeMillis();
        long timeSinceLastStart = currentTime - lastStartRequestTime;
        if (timeSinceLastStart < MIN_START_INTERVAL_MS) {
            GxyLogger.w(TAG, "Ignoring rapid start request (time since last: " + timeSinceLastStart + "ms)");
            return;
        }
        lastStartRequestTime = currentTime;

        Intent intent = new Intent(context, ForegroundService.class);
        intent.setAction(APP_TO_FOREGROUND_ACTION);

        createNotificationChannel(context);

        GxyLogger.d(TAG, "Starting foreground service");
        ComponentName componentName;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                componentName = context.startForegroundService(intent);
            } else {
                componentName = context.startService(intent);
            }

            if (componentName == null) {
                GxyLogger.w(TAG, "Foreground service not started - component name is null");
            } else {
                GxyLogger.i(TAG, "Foreground service started successfully: " + componentName.toString());
            }
        } catch (SecurityException e) {
            GxyLogger.e(TAG, "Security exception when starting foreground service", e);
        } catch (IllegalStateException e) {
            GxyLogger.e(TAG, "Illegal state when starting foreground service", e);
        } catch (RuntimeException e) {
            GxyLogger.e(TAG, "Runtime exception when starting foreground service", e);
        }
    }

    public void stop(@NonNull Context context) {
        GxyLogger.i(TAG, "Stopping foreground service. Service started: " + ForegroundService.mIsServiceStarted);
        if (!ForegroundService.mIsServiceStarted) {
            GxyLogger.d(TAG, "Foreground service not started");
            return;
        }

        GxyLogger.i(TAG, "Stopping foreground service");
        Intent intent = new Intent(context, ForegroundService.class);
        context.stopService(intent);
    }

    public void setMicOn(@NonNull Context context) {
        GxyLogger.i(TAG, "setMicOn called. Previous mIsMicOn=" + ForegroundService.mIsMicOn);
        ForegroundService.mIsMicOn = true;
        start(context);
    }

    public void setMicOff(@NonNull Context context) {
        GxyLogger.i(TAG, "setMicOff called. Previous mIsMicOn=" + ForegroundService.mIsMicOn);
        ForegroundService.mIsMicOn = false;
        stop(context);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        GxyLogger.i(TAG,
                "ForegroundService: onStartCommand. mIsMicOn=" + ForegroundService.mIsMicOn);

        try {
            Notification notification = buildNotification(this);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                int serviceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK;
                StringBuilder typesLog = new StringBuilder("Starting with MEDIA_PLAYBACK");

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && ForegroundService.mIsMicOn) {
                    serviceType |= ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
                    typesLog.append(" + MICROPHONE");
                }

                // Add CONNECTED_DEVICE type for Bluetooth/USB audio devices (Android 14+)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    serviceType |= ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE;
                    typesLog.append(" + CONNECTED_DEVICE");
                }

                GxyLogger.i(TAG, typesLog.toString());
                startForeground(NOTIFICATION_ID, notification, serviceType);
                GxyLogger.i(TAG, "Successfully started as foreground service");
            } else {
                startForeground(NOTIFICATION_ID, notification);
                GxyLogger.i(TAG, "Successfully started as foreground service (legacy)");
            }

            ForegroundService.mIsServiceStarted = true;
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

            // Perform service cleanup
            GxyLogger.i(TAG, "Performing service cleanup");
            cleanup();

            // Stop the service
            GxyLogger.i(TAG, "Stopping service after task removal");
            stopSelf();
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error in onTaskRemoved", e);
            // Still try to stop the service even if cleanup fails
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
        if (!ForegroundService.mIsServiceStarted) {
            return;
        }

        try {
            ForegroundService.mIsServiceStarted = false;
            ForegroundService.mIsMicOn = false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE);
            } else {
                stopForeground(true);
            }
            sInstance = null;
            GxyLogger.d(TAG, "Foreground service cleanup completed");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error during cleanup", e);
        }
    }

    private void createNotificationChannel(@NonNull Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager manager = (NotificationManager) context.getSystemService(NOTIFICATION_SERVICE);
        if (manager == null) {
            return;
        }

        NotificationChannel existingChannel = manager.getNotificationChannel(NOTIFICATION_CHANNEL_ID);
        if (existingChannel != null) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Arvut System Notification",
                NotificationManager.IMPORTANCE_HIGH);
        channel.setShowBadge(false);
        manager.createNotificationChannel(channel);
    }

    private Notification buildNotification(@NonNull Context context) {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setContentTitle("Arvut System")
                .setContentText("Arvut system running in background (audio mode)")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setSmallIcon(R.mipmap.arvut)
                .setOngoing(true)
                .setSilent(true)
                .setContentIntent(pendingIntent)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .build();
    }

    public static void moveAppToForeground(@NonNull Context context) {
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            context.startActivity(launchIntent);
        }
    }
}
