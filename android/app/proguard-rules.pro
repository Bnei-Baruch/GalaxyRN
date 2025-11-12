# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.galaxy_mobile.** { *; }

# Custom Logger - keep the class but allow method optimization
-keep class com.galaxy_mobile.GxyLogger {
    public static void configure(...);
    public static void setDisplayOptions(...);
    public static boolean isDebugEnabled();
    public static boolean isSentryEnabled();
    public static void setSentryReporting(...);
    public static void logDeviceInfo(java.lang.String);
    public static void critical(...);
    public static void addBreadcrumb(...);
    public static void setUserContext(...);
}

# Sentry
-keep class io.sentry.** { *; }

# React Native Core
-keep class com.facebook.react.modules.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.ReactApplication
-keep class com.facebook.react.ReactNativeHost
-keep class com.facebook.react.ReactPackage
-keep class com.facebook.react.shell.MainReactPackage
-keep class com.facebook.soloader.** { *; }

# React Native Networking
-keep class com.facebook.react.modules.network.** { *; }
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# React Native WebView
-keep class org.chromium.** { *; }
-keep class com.reactnativecommunity.webview.** { *; }

# React Native Image
-keep class com.facebook.imagepipeline.** { *; }
-keep class com.facebook.fresco.** { *; }

# React Native AsyncStorage
-keep class com.reactnativeasyncstorage.asyncstorage.** { *; }

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# React Native Navigation
-keep class com.reactnavigation.** { *; }
-keep class com.swmansion.** { *; }

# React Native Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.reanimated.** { *; }

# React Native Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# Flipper
-keep class com.facebook.flipper.** { *; }
-keep class com.facebook.jni.** { *; }

# Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# JSON parsing
-keep class com.google.gson.** { *; }
-keep class org.json.** { *; }
-keepattributes Signature
-keepattributes *Annotation*

# JSC
-keep class org.webkit.** { *; }

# Remove logs in release
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep React Native JavaScript interface
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
}

-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}

-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# Keep serialization classes
-keep class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep Parcelable classes
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep enum classes
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep views
-keep public class * extends android.view.View {
    public <init>(android.content.Context);
    public <init>(android.content.Context, android.util.AttributeSet);
    public <init>(android.content.Context, android.util.AttributeSet, int);
    public void set*(...);
}

# Keep fragment constructors
-keep public class * extends android.support.v4.app.Fragment
-keep public class * extends android.app.Fragment

# Firebase (if used)
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Crashlytics (if used)
-keep class com.crashlytics.** { *; }
-dontwarn com.crashlytics.**

# Remove debug info
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable

# Optimize
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
-dontpreverify
