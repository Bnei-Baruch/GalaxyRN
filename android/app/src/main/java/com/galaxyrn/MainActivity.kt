package com.galaxyrn

import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.bridge.ReactContext
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.oney.WebRTCModule.WebRTCModuleOptions


class MainActivity : ReactActivity() {

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "GalaxyRN"

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val options = WebRTCModuleOptions.getInstance()
        options.enableMediaProjectionService = true
    }


    override fun onDestroy() {
        super.onDestroy()

        val reactInstanceManager = reactInstanceManager
        val reactContext: ReactContext? = reactInstanceManager?.currentReactContext

        reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("AppTerminated", null)
    }
}
