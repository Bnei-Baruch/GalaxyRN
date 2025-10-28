import * as Sentry from '@sentry/react-native';

class Logger {
  hasTag(tag) {
    //if (tag === 'Mqtt' || tag === 'JanusMqtt') return false;

    return (
      //tag === 'Shidur' || tag === 'Inits' || tag === 'CallsBridge'
      // ||tag === 'Settings'
      //tag === 'StreamingPlugin'
      //tag === 'JanusMqtt' ||
      //tag === 'Mqtt' ||
      //tag === 'Shidur'
      //tag === 'Feeds' || tag === 'Feed' || tag === 'RoomLayout'
      true
    );
  }

  async trace(...args) {
    if (!this.hasTag(args[0])) return;

    console.trace(...this.prepareConsoleMsg(args));
  }

  async debug(...args) {
    if (!this.hasTag(args[0])) return;

    console.debug(...this.prepareConsoleMsg(args));
  }

  async info(...args) {
    if (!this.hasTag(args[0])) return;

    console.info(...this.prepareConsoleMsg(args));
  }

  async warn(...args) {
    if (!this.hasTag(args[0])) return;

    console.warn(...this.prepareConsoleMsg(args));
  }

  async error(...args) {
    if (!this.hasTag(args[0])) return;

    console.error(args);
    Sentry.captureException(new Error(args.join(', ')));
  }

  prepareConsoleMsg(args) {
    const firstArg = Array.isArray(args[0]) ? args[0].join(' ') : args[0];
    const _timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    return [`[${_timestamp}] [${firstArg}]`, ...args.slice(1)];
  }
}

const logger = new Logger();

export default logger;
