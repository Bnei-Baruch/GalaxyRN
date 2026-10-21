package com.galaxy_mobile.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import com.galaxy_mobile.MainActivity;
import com.galaxy_mobile.R;
import com.galaxy_mobile.logger.GxyLogger;

/**
 * Home-screen widget with three states:
 * - no room selected: logo + "open the app"; tap opens the app
 * - room selected, not in it: "Join" (com.galaxy.mobile://join deep link) +
 *   audio mode / camera toggles for the next join
 * - in the room: mic / camera toggles + open app
 *
 * The state is pushed by JS (src/zustand/widget.ts) through WidgetModule.
 * Toggles are stored here as "pending" and applied by JS: right away through
 * the widgetAction event when JS is alive, otherwise on the next app init.
 */
public class GxyWidgetProvider extends AppWidgetProvider {
    private static final String TAG = "GxyWidgetProvider";
    private static final String PREFS = "gxy_widget";
    private static final String KEY_ROOM = "last_room";
    private static final String KEY_IN_ROOM = "in_room";
    private static final String KEY_MIC_ON = "mic_on";
    private static final String KEY_CAMMUTE = "cammute";
    private static final String KEY_AUDIO_MODE = "audio_mode";
    private static final String KEY_PENDING = "pending";

    private static final String JOIN_URL = "com.galaxy.mobile://join";
    private static final String ACTION_TOGGLE_MIC = "com.galaxy_mobile.widget.TOGGLE_MIC";
    private static final String ACTION_TOGGLE_CAM = "com.galaxy_mobile.widget.TOGGLE_CAM";
    private static final String ACTION_TOGGLE_AUDIO_MODE = "com.galaxy_mobile.widget.TOGGLE_AUDIO_MODE";

    private static final int REQUEST_OPEN = 0;
    private static final int REQUEST_JOIN = 1;
    private static final int REQUEST_MIC = 2;
    private static final int REQUEST_CAM = 3;
    private static final int REQUEST_AUDIO_MODE = 4;

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static void setState(Context context, String room, boolean isInRoom,
            boolean isMicOn, boolean isCammute, boolean isAudioMode) {
        SharedPreferences prefs = prefs(context);
        SharedPreferences.Editor editor = prefs.edit()
                .putString(KEY_ROOM, room == null ? "" : room)
                .putBoolean(KEY_IN_ROOM, isInRoom);
        // Don't overwrite toggles JS hasn't consumed yet
        if (!prefs.getBoolean(KEY_PENDING, false)) {
            editor.putBoolean(KEY_MIC_ON, isMicOn)
                    .putBoolean(KEY_CAMMUTE, isCammute)
                    .putBoolean(KEY_AUDIO_MODE, isAudioMode);
        }
        editor.apply();
        updateAll(context);
    }

    // App swiped away / process about to be killed (MainApplication.performCleanup):
    // commit synchronously, apply() might not be written before the kill
    public static void onAppTerminated(Context context) {
        GxyLogger.i(TAG, "onAppTerminated");
        prefs(context).edit().putBoolean(KEY_IN_ROOM, false).commit();
        updateAll(context);
    }

    // Returns {pending, isMicOn, isCammute, isAudioMode} and clears pending
    public static boolean[] consumePending(Context context) {
        SharedPreferences prefs = prefs(context);
        boolean[] result = {
                prefs.getBoolean(KEY_PENDING, false),
                prefs.getBoolean(KEY_MIC_ON, false),
                prefs.getBoolean(KEY_CAMMUTE, true),
                prefs.getBoolean(KEY_AUDIO_MODE, false),
        };
        prefs.edit().putBoolean(KEY_PENDING, false).apply();
        return result;
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        GxyLogger.d(TAG, "onUpdate: widgets " + appWidgetIds.length);
        RemoteViews views = buildViews(context);
        for (int id : appWidgetIds) {
            manager.updateAppWidget(id, views);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (ACTION_TOGGLE_MIC.equals(action) || ACTION_TOGGLE_CAM.equals(action)
                || ACTION_TOGGLE_AUDIO_MODE.equals(action)) {
            onToggle(context, action);
            return;
        }
        super.onReceive(context, intent);
    }

    private static void onToggle(Context context, String action) {
        SharedPreferences prefs = prefs(context);
        boolean isInRoom = prefs.getBoolean(KEY_IN_ROOM, false);
        boolean isAlive = WidgetModule.isAlive();
        GxyLogger.i(TAG, "onToggle: " + action + " isInRoom: " + isInRoom + " isAlive: " + isAlive);

        if (isInRoom && !isAlive) {
            // The app died while in the room, so the in-room controls are stale
            prefs.edit().putBoolean(KEY_IN_ROOM, false).apply();
            updateAll(context);
            return;
        }

        boolean cammute = prefs.getBoolean(KEY_CAMMUTE, true);
        boolean audioMode = prefs.getBoolean(KEY_AUDIO_MODE, false);
        SharedPreferences.Editor editor = prefs.edit().putBoolean(KEY_PENDING, true);

        if (ACTION_TOGGLE_MIC.equals(action)) {
            if (!isInRoom) {
                return;
            }
            editor.putBoolean(KEY_MIC_ON, !prefs.getBoolean(KEY_MIC_ON, false));
        } else if (ACTION_TOGGLE_CAM.equals(action)) {
            // Same as the app: the camera is off in audio mode
            editor.putBoolean(KEY_CAMMUTE, !cammute);
            if (cammute && audioMode) {
                editor.putBoolean(KEY_AUDIO_MODE, false);
            }
        } else {
            editor.putBoolean(KEY_AUDIO_MODE, !audioMode);
            if (!audioMode) {
                editor.putBoolean(KEY_CAMMUTE, true);
            }
        }

        editor.apply();
        updateAll(context);
        WidgetModule.notifyAction();
    }

    private static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, GxyWidgetProvider.class));
        if (ids.length == 0) {
            return;
        }
        RemoteViews views = buildViews(context);
        for (int id : ids) {
            manager.updateAppWidget(id, views);
        }
    }

    private static RemoteViews buildViews(Context context) {
        SharedPreferences prefs = prefs(context);
        String room = prefs.getString(KEY_ROOM, "");
        boolean hasRoom = !room.isEmpty();
        boolean isInRoom = hasRoom && prefs.getBoolean(KEY_IN_ROOM, false);
        boolean isMicOn = prefs.getBoolean(KEY_MIC_ON, false);
        boolean isCamOn = !prefs.getBoolean(KEY_CAMMUTE, true);
        boolean isAudioMode = prefs.getBoolean(KEY_AUDIO_MODE, false);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_join);

        String roomText;
        if (!hasRoom) {
            roomText = context.getString(R.string.widget_no_room);
        } else if (isInRoom) {
            roomText = context.getString(R.string.widget_in_room, room);
        } else {
            roomText = room;
        }
        views.setTextViewText(R.id.widget_room, roomText);

        views.setViewVisibility(R.id.widget_join, hasRoom && !isInRoom ? View.VISIBLE : View.GONE);
        views.setViewVisibility(R.id.widget_controls, hasRoom ? View.VISIBLE : View.GONE);
        views.setViewVisibility(R.id.widget_btn_audio, !isInRoom ? View.VISIBLE : View.GONE);
        views.setViewVisibility(R.id.widget_btn_mic, isInRoom ? View.VISIBLE : View.GONE);
        views.setViewVisibility(R.id.widget_btn_cam, View.VISIBLE);
        views.setViewVisibility(R.id.widget_btn_open, isInRoom ? View.VISIBLE : View.GONE);

        setToggle(views, R.id.widget_btn_audio, isAudioMode);
        setToggle(views, R.id.widget_btn_mic, isMicOn);
        setToggle(views, R.id.widget_btn_cam, isCamOn);
        views.setImageViewResource(R.id.widget_btn_mic_icon,
                isMicOn ? R.drawable.widget_ic_mic : R.drawable.widget_ic_mic_off);
        views.setImageViewResource(R.id.widget_btn_cam_icon,
                isCamOn ? R.drawable.widget_ic_video_camera_front : R.drawable.widget_ic_video_camera_front_off);

        PendingIntent open = activityIntent(context, REQUEST_OPEN, new Intent(context, MainActivity.class)
                .setAction(Intent.ACTION_MAIN)
                .addCategory(Intent.CATEGORY_LAUNCHER));
        views.setOnClickPendingIntent(R.id.widget_root, open);
        views.setOnClickPendingIntent(R.id.widget_btn_open, open);
        views.setOnClickPendingIntent(R.id.widget_join, activityIntent(context, REQUEST_JOIN,
                new Intent(Intent.ACTION_VIEW, Uri.parse(JOIN_URL), context, MainActivity.class)));
        views.setOnClickPendingIntent(R.id.widget_btn_mic, toggleIntent(context, REQUEST_MIC, ACTION_TOGGLE_MIC));
        views.setOnClickPendingIntent(R.id.widget_btn_cam, toggleIntent(context, REQUEST_CAM, ACTION_TOGGLE_CAM));
        views.setOnClickPendingIntent(R.id.widget_btn_audio,
                toggleIntent(context, REQUEST_AUDIO_MODE, ACTION_TOGGLE_AUDIO_MODE));

        return views;
    }

    private static void setToggle(RemoteViews views, int id, boolean isOn) {
        views.setInt(id, "setBackgroundResource",
                isOn ? R.drawable.widget_toggle_on : R.drawable.widget_toggle_off);
    }

    private static PendingIntent activityIntent(Context context, int requestCode, Intent intent) {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(context, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent toggleIntent(Context context, int requestCode, String action) {
        Intent intent = new Intent(context, GxyWidgetProvider.class).setAction(action);
        return PendingIntent.getBroadcast(context, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
