package com.galaxy_mobile

import android.app.Application
import android.content.Context
import android.media.AudioManager
import android.util.Log
import com.galaxy_mobile.logger.GxyLogger
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactContext
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
                add(GxyPackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED

        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

    override fun onCreate() {
        super.onCreate()
        instance = this

        SoLoader.init(this, OpenSourceMergedSoMapping)
        
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            DefaultNewArchitectureEntryPoint.load()
        }
        
        isCleaningUp = false
    }

    companion object {
        private const val TAG = "MainApplication"
        
        @Volatile
        private var instance: MainApplication? = null
        
        @Volatile
        private var isCleaningUp = false

        @JvmStatic
        fun getInstance(): MainApplication? = instance

        @JvmStatic
        fun performCleanup() {
            if (isCleaningUp) return
            isCleaningUp = true

            GxyLogger.i(TAG, "Starting cleanup")

            // 1. Notify JS side and destroy React Native context
            try {
                instance?.reactNativeHost?.reactInstanceManager?.let { rim ->
                    try {
                        rim.currentReactContext?.let { reactContext ->
                            if (reactContext.hasActiveCatalystInstance()) {
                                reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                                    .emit("appTerminating", null)
                                GxyLogger.d(TAG, "Sent termination signal to JS - Activity status: irrelevant")
                                Thread.sleep(1000)
                            }
                        } ?: GxyLogger.w(TAG, "React context is null or no active")
                    } catch (jsError: Exception) {
                        GxyLogger.w(TAG, "Could not send JS signal (normal during swipe-kill)", jsError)
                    }

                    GxyLogger.i(TAG, "Destroying React Native context")
                    rim.destroy()
                }
            } catch (e: Exception) {
                GxyLogger.e(TAG, "Error destroying React Native context", e)
            }

            // 2. Reset audio state
            try {
                (instance?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager)?.apply {
                    abandonAudioFocus(null)
                    mode = AudioManager.MODE_NORMAL
                }
            } catch (e: Exception) {
                GxyLogger.e(TAG, "Error resetting audio", e)
            }

            // 3. Flush Sentry
            try {
                io.sentry.Sentry.flush(1000)
            } catch (e: Exception) {
                GxyLogger.e(TAG, "Error flushing Sentry", e)
            }

            // 4. Force cleanup system resources
            try {
                GxyLogger.i(TAG, "Forcing garbage collection")
                System.gc()
                System.runFinalization()

                Thread.sleep(500)

                GxyLogger.i(TAG, "Cleanup completed - terminating process")

                // More aggressive process termination
                android.os.Process.killProcess(android.os.Process.myPid())
                System.exit(0)
            } catch (e: Exception) {
                GxyLogger.e(TAG, "Error during final cleanup", e)
                System.exit(1)
            }
        }
    }
}

