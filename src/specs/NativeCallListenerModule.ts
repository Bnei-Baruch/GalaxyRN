import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import {TurboModuleRegistry} from 'react-native';
import type {EventEmitter} from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  readonly onCallStateChanged: EventEmitter<{state: string}>;
}

export default TurboModuleRegistry.get<Spec>('CallListenerModule');
