import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import { TurboModuleRegistry } from 'react-native';
import type {
  EventEmitter,
  UnsafeObject,
} from 'react-native/Libraries/Types/CodegenTypes';

// Toggles the user made on the widget that the app hasn't applied yet
export type WidgetPending = {
  pending: boolean;
  isMicOn: boolean;
  isCammute: boolean;
  isAudioMode: boolean;
};

export interface Spec extends TurboModule {
  // Pushes the app state shown on the home-screen widget ('' room = none).
  // Android: SharedPreferences; iOS: App Group UserDefaults + timeline reload.
  // While a widget change is pending, its toggle values are kept.
  setState(
    room: string,
    isInRoom: boolean,
    isMicOn: boolean,
    isCammute: boolean,
    isAudioMode: boolean
  ): void;
  // Returns and clears the pending widget toggles
  consumePending(): Promise<WidgetPending>;
  // Android-only: fired when a widget toggle is tapped while JS is alive.
  // iOS (legacy RCTEventEmitter) emits the same "widgetAction" event, reached
  // via NativeEventEmitter.
  readonly widgetAction: EventEmitter<UnsafeObject>;
}

export default TurboModuleRegistry.get<Spec>('WidgetModule');
