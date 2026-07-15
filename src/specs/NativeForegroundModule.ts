import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  setMicOn(): void;
  setMicOff(): void;
}

export default TurboModuleRegistry.get<Spec>('ForegroundModule');
