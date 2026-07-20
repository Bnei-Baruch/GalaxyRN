import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import {TurboModuleRegistry} from 'react-native';
import type {EventEmitter, UnsafeObject} from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  initAudioDevices(): void;
  handleDevicesChange(deviceId: number | null): void;
  requestAudioFocus(): void;
  abandonAudioFocus(): void;
  readonly updateAudioDevice: EventEmitter<UnsafeObject>;
}

export default TurboModuleRegistry.get<Spec>('AudioDeviceModule');
