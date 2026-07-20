import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import {TurboModuleRegistry} from 'react-native';
import type {EventEmitter, UnsafeObject} from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  activateAudioOutput(): void;
  switchAudioOutput(): void;
  releaseAudioFocus(): void;
  readonly updateAudioDevice: EventEmitter<UnsafeObject>;
}

export default TurboModuleRegistry.get<Spec>('AudioManager');
