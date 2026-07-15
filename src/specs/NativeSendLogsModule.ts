import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  sendLogs(email: string): Promise<string>;
}

export default TurboModuleRegistry.get<Spec>('SendLogsModule');
