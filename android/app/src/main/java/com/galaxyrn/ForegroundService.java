package com.galaxyrn;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;


import androidx.core.app.NotificationCompat;

import java.util.Random;


public class ForegroundService extends Service {
    static final int NOTIFICATION_ID = new Random().nextInt(99999) + 10000;
    private final String NOTIFICATION_CHANNEL_ID = "GxyNotificationChannel";
    private final String TAG = ForegroundService.class.getSimpleName();
    private Intent intent = null;


    public void start(Context context) {
        Log.w(TAG, "start");
        createChannel(context);
        intent = new Intent(context, ForegroundService.class);
        ComponentName componentName;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                componentName = context.startForegroundService(intent);
            } else {
                componentName = context.startService(intent);
            }
        } catch (RuntimeException e) {
            // Avoid crashing due to ForegroundServiceStartNotAllowedException (API level 31).
            // See: https://developer.android.com/guide/components/foreground-services#background-start-restrictions
            Log.w(TAG, "Media projection service not started", e);
            return;
        }

        if (componentName == null) {
            Log.w(TAG, "Media projection service not started");
        } else {
            Log.i(TAG, "Media projection service started");
        }
    }

    public void abort(Context context) {
        if (intent != null) {
            context.stopService(intent);
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "foreground service onStartCommand");
        Notification notification = buildNotification(this);


        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        return START_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        Log.i(TAG, "foreground service onTaskRemoved");
        stopForeground(true);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopForeground(true);
    }

    private void createChannel(Context context) {
        Log.d("Background bug", "createNotificationChannel");
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        if (context == null) {
            Log.d(TAG, " Cannot create notification channel: no current context");
            return;
        }

        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Service.NOTIFICATION_SERVICE);

        NotificationChannel channel = notificationManager.getNotificationChannel(NOTIFICATION_CHANNEL_ID);
        if (channel != null) {
            // The channel was already created
            return;
        }

        channel = new NotificationChannel(NOTIFICATION_CHANNEL_ID, "Arvut system notification", NotificationManager.IMPORTANCE_HIGH);
        channel.setShowBadge(false);

        notificationManager.createNotificationChannel(channel);
    }

    private Notification buildNotification(Context context) {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID);
        //Bitmap largeIconBitmap = BitmapFactory.decodeResource(context.getResources(), R.drawable.arvut);
        return builder
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setContentTitle("Title")
                .setContentText("content")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setSmallIcon(R.mipmap.arvut)
                .setOngoing(true)
                .setSilent(true)
                //.setLargeIcon(largeIconBitmap)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .build();
    }
}
