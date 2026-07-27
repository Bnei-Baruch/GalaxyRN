package com.galaxy_mobile.uiState;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.galaxy_mobile.logger.GxyLogger;

public class UIApdateReceiver extends BroadcastReceiver {
  private static final String TAG = "UIApdateReceiver";

  public static final String ACTION_JOIN_ROOM = "com.galaxy_mobile.ACTION_JOIN_ROOM";
  public static final String ACTION_LEAVE_ROOM = "com.galaxy_mobile.ACTION_LEAVE_ROOM";
  public static final String ACTION_MUTE = "com.galaxy_mobile.ACTION_MUTE";
  public static final String ACTION_UNMUTE = "com.galaxy_mobile.ACTION_UNMUTE";
  public static final String ACTION_CAM_MUTE = "com.galaxy_mobile.ACTION_CAM_MUTE";
  public static final String ACTION_CAM_UNMUTE = "com.galaxy_mobile.ACTION_CAM_UNMUTE";

  @Override
  public void onReceive(Context context, Intent intent) {
    String action = intent.getAction();
    GxyLogger.i(TAG, "onReceive called with action: " + action);
    WritableMap params = Arguments.createMap();
    if (ACTION_JOIN_ROOM.equals(action)) {
      params.putString("action", "join_room");
      GxyUIStateModule.dispatchNativePlayerEvent(params);
    } else if (ACTION_LEAVE_ROOM.equals(action)) {
      params.putString("action", "leave_room");
      GxyUIStateModule.dispatchNativePlayerEvent(params);
    } else if (ACTION_MUTE.equals(action)) {
      params.putString("action", "mute");
      GxyUIStateModule.dispatchNativePlayerEvent(params);
    } else if (ACTION_UNMUTE.equals(action)) {
      params.putString("action", "unmute");
      GxyUIStateModule.dispatchNativePlayerEvent(params);
    } else if (ACTION_CAM_MUTE.equals(action)) {
      params.putString("action", "cam_mute");
      GxyUIStateModule.dispatchNativePlayerEvent(params);
    } else if (ACTION_CAM_UNMUTE.equals(action)) {
      params.putString("action", "cam_unmute");
      GxyUIStateModule.dispatchNativePlayerEvent(params);
    } else if (Intent.ACTION_SCREEN_OFF.equals(action)) {
      params.putString("action", "screen_off");
      GxyUIStateModule.dispatchNativePlayerEvent(params);
    }
  }
}