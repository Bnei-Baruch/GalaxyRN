package com.galaxyrn

import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.oney.WebRTCModule.WebRTCModuleOptions

class MainActivity : ReactActivity() {

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "GalaxyRN"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null)

        Log.i("GalaxyRN custom: MainActivity", "MainActivity onCreate")


        val options = WebRTCModuleOptions.getInstance()
        options.enableMediaProjectionService = true
    }

    /*
        override fun onDestroy() {
            super.onDestroy()
        }
    */

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
    /*
        @Override
        protected List<ReactPackage> getPackages()
        {
            @SuppressWarnings("UnnecessaryLocalVariable")
            List<ReactPackage> packages = new PackageList(this).getPackages();
            // Packages that cannot be autolinked yet can be added manually here, for example:
            packages.add(new MyReactPackage ()); // Replace 'MyReactPackage' with your package that contains the module
            return packages;
        }
    */
}
