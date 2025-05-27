package com.galaxyrn.foreground;

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
import android.os.Handler;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.galaxyrn.R;

public class ForegroundService extends Service {
    private static final String TAG = "ForegroundService";
    private static final int NOTIFICATION_ID = 9999;
    private static final String NOTIFICATION_CHANNEL_ID = "GxyNotificationChannel";
    public static final String APP_TO_FOREGROUND_ACTION = "APP_TO_FOREGROUND";

    private volatile boolean mIsServiceStarted = false;
    private final Handler mHandler = new Handler(android.os.Looper.getMainLooper());
    private static ForegroundService sInstance;

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        sInstance = this;
        Log.i(TAG, "ForegroundService: onCreate");
    }

    /**
     * Starts the foreground service
     *
     * @param context The application context
     */
    public void start(@NonNull Context context) {
        Intent intent = new Intent(context, ForegroundService.class);
        intent.setAction(APP_TO_FOREGROUND_ACTION);

        createNotificationChannel(context);

        Log.d(TAG, "Starting foreground service");
        ComponentName componentName = null;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                componentName = context.startForegroundService(intent);
            } else {
                componentName = context.startService(intent);
            }
        } catch (RuntimeException e) {
            Log.w(TAG, "Failed to start foreground service", e);
            return;
        }

        if (componentName == null) {
            Log.w(TAG, "Foreground service not started");
        } else {
            Log.i(TAG, "Foreground service started successfully");
        }
    }

    /**
     * Stops the foreground service
     *
     * @param context The application context
     */
    public void stop(@NonNull Context context) {
        Log.i(TAG, "Stopping foreground service");

        if (sInstance != null) {
            if (!sInstance.mIsServiceStarted) {
                Log.i(TAG, "Service not fully started yet, delaying stop request");
                mHandler.postDelayed(() -> {
                    stopServiceSafely(context);
                }, 500);
                return;
            }
        }

        stopServiceSafely(context);
    }

    /**
     * Safely stops the service after ensuring it's been properly started
     */
    private void stopServiceSafely(Context context) {
        Intent intent = new Intent(context, ForegroundService.class);
        boolean stopped = context.stopService(intent);
        Log.i(TAG, "Service stopped by context: " + stopped);

        if (!stopped && sInstance != null) {
            sInstance.cleanup();
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "ForegroundService: onStartCommand");

        // Create and start foreground immediately to avoid timing issues
        Notification notification = buildNotification(this);

        try {
            // Start foreground before doing anything else to avoid timeout
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }

            // Mark that service is now in foreground state
            mIsServiceStarted = true;
            Log.i(TAG, "Successfully called startForeground()");
        } catch (Exception e) {
            Log.e(TAG, "Error starting foreground", e);
        }
        return START_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        Log.i(TAG, "ForegroundService: onTaskRemoved - App was swiped away");

        cleanup();
    }

    @Override
    public void onDestroy() {
        Log.i(TAG, "ForegroundService: onDestroy - Service is being destroyed");
        try {
            cleanup();
            Log.i(TAG, "ForegroundService: onDestroy completed - Resources cleaned up");
        } catch (Exception e) {
            Log.e(TAG, "Error during onDestroy cleanup", e);
        } finally {
            super.onDestroy();
        }
    }
    
    private void cleanup() {
        try {
            mIsServiceStarted = false;

            // First stop foreground state
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE);
            } else {
                stopForeground(true);
            }

            // Clear any pending handler callbacks to prevent memory leaks
            if (mHandler != null) {
                mHandler.removeCallbacksAndMessages(null);
            }

            // Clear static instance reference
            sInstance = null;

            stopSelf();

            Log.i(TAG, "Service cleanup completed");
        } catch (Exception e) {
            Log.e(TAG, "Error during cleanup", e);
        }
    }

    /**
     * Creates the notification channel (required for Android O and above)
     *
     * @param context The application context
     */
    private void createNotificationChannel(@NonNull Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager manager = (NotificationManager) context.getSystemService(NOTIFICATION_SERVICE);
        if (manager == null) {
            Log.d(TAG, "Cannot create notification channel: no NotificationManager");
            return;
        }

        NotificationChannel existingChannel = manager.getNotificationChannel(NOTIFICATION_CHANNEL_ID);
        if (existingChannel != null) {
            // Channel already exists
            return;
        }

        NotificationChannel channel = new NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Arvut System Notification",
                NotificationManager.IMPORTANCE_HIGH);
        channel.setShowBadge(false);
        manager.createNotificationChannel(channel);
        Log.d(TAG, "Notification channel created");
    }

    /**
     * Builds the notification for the foreground service
     *
     * @param context The application context
     * @return The notification
     */
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

    /**
     * Brings the app to the foreground
     *
     * @param context The application context
     */
    public static void moveAppToForeground(@NonNull Context context) {
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            context.startActivity(launchIntent);
        }
    }
}
