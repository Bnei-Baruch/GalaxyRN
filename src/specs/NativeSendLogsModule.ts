import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Appends newline-terminated, already formatted lines to the log file
  appendLogs(text: string): void;
  // Native debug/verbose lines go to the file until this epoch ms (0 = off)
  setVerboseUntil(until: number): void;
  // Whole rotated log, oldest first
  readLogs(): Promise<string>;
}

export default TurboModuleRegistry.get<Spec>('SendLogsModule');
