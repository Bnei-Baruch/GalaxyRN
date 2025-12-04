package com.galaxy_mobile

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.galaxy_mobile.audioManager.AudioDeviceModule
import com.galaxy_mobile.callManager.CallListenerModule
import com.galaxy_mobile.foreground.ForegroundModule
import com.galaxy_mobile.logger.GxyLogger

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost =
            object : DefaultReactNativeHost(this) {
                override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

                override fun getPackages(): List<ReactPackage> =
                        PackageList(this).packages.apply { add(GxyPackage()) }

                override fun getJSMainModuleName(): String = "index"

                override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED

                override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
            }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(this.applicationContext, reactNativeHost)

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

        @Volatile private var instance: MainApplication? = null

        @Volatile private var isCleaningUp = false

        @JvmStatic fun getInstance(): MainApplication? = instance

        @JvmStatic
        fun cleanupCustomModules(reactContext: ReactApplicationContext) {
            (reactContext.getNativeModule(CallListenerModule::class.java) as CallListenerModule)
                    .cleanup()
            (reactContext.getNativeModule(AudioDeviceModule::class.java) as AudioDeviceModule)
                    .cleanup()
            (reactContext.getNativeModule(WakeLockModule::class.java) as WakeLockModule).cleanup()
            (reactContext.getNativeModule(SendLogsModule::class.java) as SendLogsModule).cleanup()
            (reactContext.getNativeModule(ForegroundModule::class.java) as ForegroundModule)
                    .cleanup()
        }

        @JvmStatic
        fun performCleanup() {
            if (isCleaningUp) return
            isCleaningUp = true

            GxyLogger.i(TAG, "Starting cleanup")
            instance?.reactHost?.currentReactContext?.let { reactContext ->
                cleanupCustomModules(reactContext as ReactApplicationContext)
            }
                    ?: GxyLogger.e(TAG, "ReactApplicationContext is null")

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
