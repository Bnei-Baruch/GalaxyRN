import { AppState } from 'react-native';
import NativeSendLogsModule from '../specs/NativeSendLogsModule';

// Persistent log file: lines are buffered in JS and handed to native in
// batches, native appends them to a rotating file (see LogFileWriter on both
// platforms). Must not import logger — logger imports this module.

const FLUSH_INTERVAL_MS = 5000;
const MAX_BUFFER_CHARS = 64 * 1024;
const MAX_ARG_CHARS = 2000;

const Native = NativeSendLogsModule;

let buffer: string[] = [];
let bufferChars = 0;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let verboseUntil = 0;

export const isVerbose = (): boolean =>
  verboseUntil !== 0 && Date.now() < verboseUntil;

export const getVerboseUntil = (): number => verboseUntil;

export const setVerboseUntil = (until: number): void => {
  verboseUntil = until;
  Native?.setVerboseUntil(until);
};

const SECRET_PATTERNS: [RegExp, string][] = [
  [/eyJ[\w-]{5,}\.[\w-]{5,}\.[\w-]*/g, '<jwt>'],
  [/(Bearer\s+)[\w\-.~+/=]+/gi, '$1<redacted>'],
  [
    /("?(?:access_?token|refresh_?token|id_?token|password|secret)"?\s*[:=]\s*"?)[^"\s,&}]+/gi,
    '$1<redacted>',
  ],
];

const mask = (text: string): string =>
  SECRET_PATTERNS.reduce((acc, [re, repl]) => acc.replace(re, repl), text);

const safeStringify = (value: unknown): string => {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, val) => {
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) return '[Circular]';
      seen.add(val);
    }
    return val;
  });
};

const argToString = (arg: unknown): string => {
  let str: string;
  if (typeof arg === 'string') {
    str = arg;
  } else if (typeof arg === 'function') {
    str = `[Function ${arg.name || 'anonymous'}]`;
  } else if (arg instanceof Error) {
    str = `${arg.name}: ${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`;
  } else {
    try {
      str = safeStringify(arg) ?? String(arg);
    } catch {
      str = String(arg);
    }
  }
  return str.length > MAX_ARG_CHARS
    ? `${str.slice(0, MAX_ARG_CHARS)}…(+${str.length - MAX_ARG_CHARS})`
    : str;
};

export const flushLogs = (): void => {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (!buffer.length || !Native) return;

  const text = buffer.join('');
  buffer = [];
  bufferChars = 0;
  Native.appendLogs(text);
};

// args: [tag, ...rest] as passed to logger
export const writeLogLine = (level: string, args: unknown[]): void => {
  if (!Native) return;

  const [tag, ...rest] = args;
  const tagStr = Array.isArray(tag) ? tag.join(' ') : String(tag);
  const line = mask(
    `${new Date().toISOString()} ${level} [${tagStr}] ${rest
      .map(argToString)
      .join(' ')}\n`
  );

  buffer.push(line);
  bufferChars += line.length;

  if (bufferChars >= MAX_BUFFER_CHARS) {
    flushLogs();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushLogs, FLUSH_INTERVAL_MS);
  }
};

// Timers are throttled in background — don't keep lines in memory there
AppState.addEventListener('change', state => {
  if (state !== 'active') flushLogs();
});
