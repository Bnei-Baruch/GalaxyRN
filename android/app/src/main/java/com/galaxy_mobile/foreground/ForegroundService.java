package com.galaxy_mobile.foreground;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
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
import com.facebook.react.bridge.ReactApplicationContext;
import com.galaxy_mobile.MainApplication;

public class ForegroundService extends Service {
    private static final String TAG = "ForegroundService";
    private static final int NOTIFICATION_ID = 9999;
    private static final String NOTIFICATION_CHANNEL_ID = "GxyNotificationChannel";
    public static final String APP_TO_FOREGROUND_ACTION = "APP_TO_FOREGROUND";

    private static boolean isMicOn = false;
    private  ReactApplicationContext reactContext;
    

    public ForegroundService() {
        super();
    }

    public ForegroundService(ReactApplicationContext reactContext) {
        GxyLogger.d(TAG, "constructor called");
        this.reactContext = reactContext;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        GxyLogger.i(TAG, "ForegroundService: onCreate");
    }

    public void init() {
        GxyLogger.i(TAG, "init() called");
        Intent intent = new Intent(this.reactContext, ForegroundService.class);
        this.reactContext.startService(intent);
        GxyLogger.i(TAG, "init completed");
    }

    public void start() {
        GxyLogger.i(TAG, "start() called");

        createNotificationChannel(this.reactContext);
        Notification notification = buildNotification(this.reactContext);

        GxyLogger.d(TAG, "starting service");

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                int serviceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK;
                StringBuilder typesLog = new StringBuilder("Starting with MEDIA_PLAYBACK");

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && ForegroundService.isMicOn) {
                    serviceType |= ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
                    typesLog.append(" + MICROPHONE");
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    serviceType |= ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE;
                    typesLog.append(" + CONNECTED_DEVICE");
                }

                GxyLogger.i(TAG, typesLog.toString());
                startForeground(NOTIFICATION_ID, notification, serviceType);
                GxyLogger.i(TAG, "service started");
            } else {
                startForeground(NOTIFICATION_ID, notification);
                GxyLogger.i(TAG, "service started (legacy)");
            }

            GxyLogger.i(TAG, "service started");
        } catch (SecurityException e) {
            GxyLogger.e(TAG, "Security exception on start", e);
        } catch (IllegalStateException e) {
            GxyLogger.e(TAG, "Illegal state on start", e);
        } catch (RuntimeException e) {
            GxyLogger.e(TAG, "Runtime exception on start", e);
        }
    }

    public void stop() {
        stopForeground(STOP_FOREGROUND_LEGACY);
        GxyLogger.i(TAG, "service stopped");
    }

    public void setMicOn() {
        GxyLogger.i(TAG, "setMicOn called");
        ForegroundService.isMicOn = true;
    }

    public void setMicOff() {
        GxyLogger.i(TAG, "setMicOff called");
        ForegroundService.isMicOn = false;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        GxyLogger.i(TAG, "onStartCommand. isMicOn=" + Boolean.toString(ForegroundService.isMicOn));
        return START_NOT_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        GxyLogger.i(TAG, "onTaskRemoved called");

        try {
            MainApplication app = MainApplication.getInstance();
            if (app != null) {
                GxyLogger.i(TAG, "MainApplication cleanup");
                MainApplication.performCleanup();
            }
            GxyLogger.i(TAG, "service stopped by onTaskRemoved");
            cleanup();
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error on onTaskRemoved", e);
        }
    }

    public void cleanup() {
        GxyLogger.d(TAG, "cleanup() called");
        try {
            stopSelf();
            GxyLogger.d(TAG, "cleanup completed");
        } catch (Exception e) {
            GxyLogger.e(TAG, "Error on cleanup(): " + e.getMessage(), e);
        }
    }

    private void createNotificationChannel(@NonNull Context context) {
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

    public static void bringAppToForeground(@NonNull Context context) {
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            context.startActivity(launchIntent);
        }
    }
}
