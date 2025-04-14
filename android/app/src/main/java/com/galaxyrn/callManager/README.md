# Call Manager Package

## Overview
The Call Manager package provides functionality to monitor phone call events in the Android application and communicate these events to the React Native JavaScript layer. It allows the app to respond to phone call state changes and manage app behavior during and after calls.

## Components

### CallStateType
An enum defining the different call states that the app can track:
- `ON_START_CALL`: When a call is initiated or received
- `ON_END_CALL`: When a call ends
- `ON_RINGING`: When the phone is ringing (incoming call)
- `ON_OFFHOOK`: When a call is active
- `UNKNOWN`: Unknown or unhandled state

### ICallListener
Interface for call listeners that abstracts call state monitoring functionality:
- `initialize(context)`: Initialize the listener with a React context
- `cleanup()`: Clean up resources and stop listening for events
- `isInitialized()`: Check if the listener is initialized

### PhoneCallListener
Implementation of `ICallListener` using Android's `PhoneStateListener`:
- Singleton pattern to ensure only one instance is active
- Monitors phone call state changes through the TelephonyManager
- Dispatches events to JavaScript through the CallEventManager

### CallEventManager
Manages communication of call events to the JavaScript layer:
- `dispatchCallStateEvent(state)`: Sends a call state event to JavaScript
- `bringAppToForeground(context)`: Brings the app to the foreground after a call ends

### CallListenerModule
React Native module that manages the lifecycle of the call listener:
- Initializes the call listener when the module is initialized
- Manages the listener during app lifecycle events (resume, pause, destroy)
- Exposes call functionality to React Native

## Integration
The CallListenerModule is registered in the main app's GxyPackage:

```java
// In GxyPackage.java
@Override
public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    // ... other modules
    modules.add(new CallListenerModule(reactContext));
    // ... other modules
    return modules;
}
```

## Usage in React Native

Listen for call events in your React Native code:
```javascript
import { NativeEventEmitter, NativeModules } from 'react-native';

const { CallListenerModule } = NativeModules;
const callEventEmitter = new NativeEventEmitter(CallListenerModule);

callEventEmitter.addListener('onCallStateChanged', (event) => {
  console.log('Call state changed:', event.state);
  // Handle different call states
  switch (event.state) {
    case 'ON_START_CALL':
      // Handle call started
      break;
    case 'ON_END_CALL':
      // Handle call ended
      break;
    // Handle other states
  }
});
```

## Notes
- This package requires the `PHONE_STATE` permission in AndroidManifest.xml
- Minimum Android API level: 23 (Marshmallow)
- The module is automatically initialized when the app starts 