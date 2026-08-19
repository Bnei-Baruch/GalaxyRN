import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import {TurboModuleRegistry} from 'react-native';
import type {EventEmitter} from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  setTimeout(id: number, timeoutMs: number): void;
  start(): void;
  stop(): void;
  readonly timeout: EventEmitter<number>;
}

export default TurboModuleRegistry.get<Spec>('BackgroundTimerModule');
