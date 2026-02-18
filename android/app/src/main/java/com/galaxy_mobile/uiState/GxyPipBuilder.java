package com.galaxy_mobile.uiState;

import android.app.Activity;
import android.app.PendingIntent;
import android.app.PictureInPictureParams;
import android.app.RemoteAction;
import android.content.Intent;
import android.graphics.Rect;
import android.graphics.drawable.Icon;
import android.os.Build;
import android.util.DisplayMetrics;
import android.util.Rational;

import com.facebook.react.bridge.ReactApplicationContext;
import com.galaxy_mobile.R;
import com.galaxy_mobile.uiState.UIApdateReceiver;
import com.galaxy_mobile.logger.GxyLogger;
import com.galaxy_mobile.uiState.GxyUIStateModule;

import java.util.ArrayList;
import java.util.List;

public class GxyPipBuilder {
    private static final String TAG = "GxyPipBuilder";
    private final ReactApplicationContext context;

    public GxyPipBuilder(ReactApplicationContext context) {
        this.context = context;
    }

    public void build() {
        GxyLogger.i(TAG, "build called");
        Activity activity = context.getCurrentActivity();
        if (activity == null) {
            GxyLogger.e(TAG, "build: no Activity available");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                PictureInPictureParams params = buildParams();
                activity.setPictureInPictureParams(params);
            } catch (Exception e) {
                GxyLogger.e(TAG, "build failed", e);
            }
        });
    }

    private PictureInPictureParams buildParams() {
        PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder();
        builder.setAspectRatio(new Rational(1, 1));
        DisplayMetrics displayMetrics = context.getResources().getDisplayMetrics();
        Rect rect = new Rect(0, 0, displayMetrics.widthPixels, displayMetrics.heightPixels);
        builder.setSourceRectHint(rect);
        builder.setSeamlessResizeEnabled(true);
        List<RemoteAction> actions = buildActions();
        builder.setActions(actions);
        return builder.build();
    }

    private List<RemoteAction> buildActions() {
        List<RemoteAction> actions = new ArrayList<>();
        actions.add(buildMuteAction());
        actions.add(buildCamMuteAction());
        return actions;
    }

    private RemoteAction buildMuteAction() {
        String action = UIApdateReceiver.ACTION_MUTE;
        int requestCode = 1;
        Icon icon = null;
        String title = "Mute";
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;

        if (GxyUIStateModule.isMicOn) {
            icon = Icon.createWithResource(context, R.drawable.mic_off_24px);
        } else {
            requestCode = 2;
            title = "Unmute";
            action = UIApdateReceiver.ACTION_UNMUTE;
            icon = Icon.createWithResource(context, R.drawable.mic_24px);
        }

        Intent intent = new Intent(context, UIApdateReceiver.class).setAction(action);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);
        return new RemoteAction(icon, title, title, pendingIntent);
    }

    private RemoteAction buildCamMuteAction() {
        String action = UIApdateReceiver.ACTION_CAM_MUTE;
        int requestCode = 1;
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        Icon icon = null;
        String title = "Camera Off";

        if (GxyUIStateModule.isCammute) {
            requestCode = 2;
            title = "Camera On";
            action = UIApdateReceiver.ACTION_CAM_UNMUTE;
            icon = Icon.createWithResource(context, R.drawable.video_camera_front_24px);
        } else {
            icon = Icon.createWithResource(context, R.drawable.video_camera_front_off_24px);
        }

        Intent intent = new Intent(context, UIApdateReceiver.class).setAction(action);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);
        return new RemoteAction(icon, title, title, pendingIntent);
    }

}
