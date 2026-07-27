import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import {TurboModuleRegistry} from 'react-native';
import type {
  EventEmitter,
  UnsafeObject,
} from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  startForeground(): Promise<boolean>;
  stopForeground(): Promise<boolean>;
  updateUIState(
    isMicOn: boolean,
    isInRoom: boolean,
    room: string,
    isCammute: boolean
  ): void;
  activatePip(): Promise<boolean>;
  // Android-only events (routed through the module's static self-ref from
  // Service/BroadcastReceiver/Application contexts — see GxyUIStateModule.java).
  // Codegen: systemEvent -> emitSystemEvent, nativePlayerEvent -> emitNativePlayerEvent.
  readonly systemEvent: EventEmitter<UnsafeObject>;
  readonly nativePlayerEvent: EventEmitter<UnsafeObject>;
}

export default TurboModuleRegistry.get<Spec>('GxyUIStateModule');
