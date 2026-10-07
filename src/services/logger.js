import { captureException } from '../libs/sentry/sentryHelper';
import { isVerbose, writeLogLine } from './logFile';

// Console output only in dev builds. The log file always gets info and above;
// trace/debug go to the file only while verbose logging is on
// (see zustand/verboseLogging).
const isConsole = __DEV__;

class Logger {
  hasTag(tag) {
    //if (tag === 'Mqtt' || tag === 'JanusMqtt') return false;

    return true;
    return (
      //tag === 'Shidur' || tag === 'Inits' || tag === 'CallsBridge'
      tag === 'StreamingPlugin' ||
      //tag === 'JanusMqtt' ||
      //tag === 'ConnectionMonitor' ||
      //tag === 'PublisherPlugin' ||
      //tag === 'SubscriberPlugin' ||
      tag === 'Mqtt' ||
      //tag === 'MqttConnectionModal' ||
      //tag === 'ConnectionNotStable' ||
      tag === 'ConnectionMonitor' ||
      //tag === 'FeedsStore' ||
      //tag === 'Feed' ||
      tag === 'SentryHelper' ||
      tag === 'xxx'
    );
  }

  trace(...args) {
    const verbose = isVerbose();
    if ((!isConsole && !verbose) || !this.hasTag(args[0])) return;

    if (verbose) writeLogLine('T', args);
    if (isConsole) console.trace(...this.prepareConsoleMsg(args));
  }

  debug(...args) {
    const verbose = isVerbose();
    if ((!isConsole && !verbose) || !this.hasTag(args[0])) return;

    if (verbose) writeLogLine('D', args);
    if (isConsole) console.debug(...this.prepareConsoleMsg(args));
  }

  info(...args) {
    if (!this.hasTag(args[0])) return;

    writeLogLine('I', args);
    if (isConsole) console.info(...this.prepareConsoleMsg(args));
  }

  warn(...args) {
    if (!this.hasTag(args[0])) return;

    writeLogLine('W', args);
    console.warn(...this.prepareConsoleMsg(args));
  }

  error(...args) {
    if (!this.hasTag(args[0])) return;

    writeLogLine('E', args);
    console.error(args);

    captureException(args);
  }

  prepareConsoleMsg(args) {
    const firstArg = Array.isArray(args[0]) ? args[0].join(' ') : args[0];
    const _timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    return [`[${_timestamp}] [${firstArg}]`, ...args.slice(1)];
  }
}

const logger = new Logger();

export default logger;
