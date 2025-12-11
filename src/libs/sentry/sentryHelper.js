import * as Sentry from '@sentry/react-native';
import logger from '../../services/logger';

const DEFAULT_NAMESPACE = 'SentryHelper';

/**
 * Set user information for Sentry tracking
 * @param {Object} user - User information
 */
export const setUser = user => {
  if (!user || !user.id) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

/**
 * Clear user information when user logs out
 */
export const clearUser = () => {
  Sentry.setUser(null);
};

/**
 * Add breadcrumb to Sentry
 * @param {string} category - Breadcrumb category
 * @param {string} message - Breadcrumb message
 * @param {Object} data - Additional data
 * @param {string} level - Severity level
 */
export const addBreadcrumb = (category, message, data = {}, level = 'info') => {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
  });
};

/**
 * Set tag value for current scope
 * @param {string} key - Tag key
 * @param {string} value - Tag value
 */
export const setTag = (key, value) => {
  Sentry.setTag(key, value);
};

// Store for active sessions (to access from different parts of the app)
// Each session stores: { span, finish }
const activeSessions = new Map();

/**
 * Start a named session that can be accessed from different parts of the app
 * Uses Sentry.startSpanManual() for long-running operations with manual control
 *
 * @param {string} key - Unique key to identify this session (e.g., ROOM_SESSION)
 * @param {string} name - Session name (e.g., 'Join Room')
 * @param {string} op - Operation type (e.g., 'navigation', 'connection')
 * @returns {Span} - Sentry span
 */
export const startTransaction = (
  key,
  name,
  op,
  NAMESPACE = DEFAULT_NAMESPACE
) => {
  logger.debug(NAMESPACE, 'startTransaction', key, name, op);

  return Sentry.startSpanManual({ name, op }, (span, finish) => {
    activeSessions.set(key, { span, finish });
    logger.debug(NAMESPACE, `Started session: ${key} (${name})`);
  });
};

/**
 * Add a child span to an active session
 * Uses Sentry.startSpan() which automatically attaches to active parent span
 *
 * @param {string} key - Key of the parent session
 * @param {string} operation - Span operation name (e.g., 'device.setup', 'janus.init')
 * @param {Object} attributes - Additional attributes for the span
 * @returns {Span|null} - Sentry span or null if session not found
 */
export const addSpan = (key, op, attributes = {}) => {
  const namespace = attributes.NAMESPACE || DEFAULT_NAMESPACE;
  logger.debug(namespace, 'addSpan', key, op, attributes);
  const session = activeSessions.get(key);

  if (!session) {
    logger.warn(namespace, `Session ${key} not found, cannot add span`);
    // Возвращаем инактивный span чтобы не сломать код
    return Sentry.startInactiveSpan({ name: op, op, attributes });
  }

  // startSpan автоматически привяжется к активному родительскому span
  let childSpan = null;
  Sentry.withActiveSpan(session.span, () => {
    childSpan = Sentry.startInactiveSpan({ name: op, op, attributes });
  });

  logger.debug(namespace, `Added span to ${key}: ${op}`);
  return childSpan;
};

export const addFinishSpan = (key, op, attributes = {}) => {
  const span = addSpan(key, op, attributes);
  span.setStatus('ok');
  span.end();
};

/**
 * Finish a span with status
 * @param {Span} span - The span to finish
 * @param {string} status - Status: 'ok', 'cancelled', 'internal_error', etc.
 */
export const finishSpan = (
  span,
  status = 'ok',
  NAMESPACE = DEFAULT_NAMESPACE
) => {
  logger.debug(NAMESPACE, 'finishSpan', status);
  if (!span) return;
  span.setStatus(status);
  span.end();
};

/**
 * Finish a named session
 * @param {string} key - Key of the session to finish
 * @param {string} status - Status: 'ok', 'cancelled', 'internal_error', etc.
 */
export const finishTransaction = (
  key,
  status = 'ok',
  NAMESPACE = DEFAULT_NAMESPACE
) => {
  const session = activeSessions.get(key);

  if (!session) {
    logger.warn(NAMESPACE, `Session ${key} not found, cannot finish`);
    return;
  }

  session.span.setStatus(status);
  session.finish(); // Вызываем finish из startSpanManual
  activeSessions.delete(key);

  logger.debug(NAMESPACE, `Finished session: ${key} with status ${status}`);
};

/**
 * Add tags/attributes to a session for filtering
 * @param {string} key - Key of the session
 * @param {Object} tags - Object with tag key-value pairs
 */
export const setTransactionTags = (
  key,
  tags,
  NAMESPACE = DEFAULT_NAMESPACE
) => {
  const session = activeSessions.get(key);
  logger.debug(NAMESPACE, 'setTransactionTags', key, tags);
  if (!session) {
    logger.warn(NAMESPACE, `Session ${key} not found, cannot set tags`);
    return;
  }

  Object.keys(tags).forEach(tagKey => {
    session.span.setTag(tagKey, tags[tagKey]);
  });
};

/**
 * Set attributes on a session span
 * @param {string} key - Key of the session
 * @param {Object} attributes - Object with attribute key-value pairs
 */
export const setTransactionAttributes = (key, attributes) => {
  const namespace = attributes.NAMESPACE || DEFAULT_NAMESPACE;
  const session = activeSessions.get(key);
  if (!session) {
    logger.warn(namespace, `Session ${key} not found, cannot set attributes`);
    return;
  }

  // Используем setAttributes для установки всех атрибутов одновременно
  session.span.setAttributes(attributes);
  logger.debug(namespace, `Set attributes on ${key}:`, attributes);
};

/**
 * Set attributes on a span directly
 * @param {Span} span - The span to set attributes on
 * @param {Object} attributes - Attributes to set
 */
export const setSpanAttributes = (span, attributes) => {
  if (!span) {
    logger.warn(DEFAULT_NAMESPACE, 'Span not found, cannot set attributes');
    return;
  }

  const namespace = span.attributes?.NAMESPACE || DEFAULT_NAMESPACE;
  span.setAttributes(attributes);
  logger.debug(namespace, 'Set attributes on span:', attributes);
};

export const captureException = args => {
  const key = args[args.length - 1];

  if (args[2] instanceof Error) {
    args[2] = JSON.stringify({
      message: args[2].message,
      code: args[2].code,
    });
  }

  let activeSpan = activeSessions.get(key);
  if (!activeSpan) {
    activeSpan = Sentry.getActiveSpan();
  } else {
    args = args.slice(0, -1);
  }

  if (activeSpan) {
    Sentry.withActiveSpan(activeSpan, () => {
      Sentry.captureException(new Error(args.join(', ')));
    });
  } else {
    Sentry.captureException(new Error(args.join(', ')));
  }
};

export const setIsDebug = debug => {
  Sentry.setIsDebug(debug);
};
