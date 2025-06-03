import * as Sentry from '@sentry/react-native';
import { SENTRY_LEVEL } from '@env';
import { error } from '../../services/logger';

const NAMESPACE = 'SentryHelper';
  
export const sendSentry = (msg, level = 'info') => {
  if (!__DEV__ && SENTRY_LEVEL === 'error')
    return;
  Sentry.captureMessage(msg, { level });
};

/**
 * Capture an exception and send to Sentry
 * @param {Error} error - The error to capture
 * @param {Object} extraData - Additional data to include
 */
export const captureException = (error, extraData = {}) => {
  if (!__DEV__) {
    Sentry.withScope((scope) => {
      if (extraData) {
        Object.keys(extraData).forEach(key => {
          scope.setExtra(key, extraData[key]);
        });
      }
      Sentry.captureException(error);
    });
  } else {
    error(NAMESPACE, "Error", error);
  }
};

/**
 * Set user information for Sentry tracking
 * @param {Object} user - User information
 */
export const setUser = (user) => {
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

/**
 * Create transaction for performance monitoring
 * @param {string} name - Transaction name
 * @param {string} op - Operation name
 * @returns {Transaction} - Sentry transaction
 */
export const startTransaction = (name, op) => {
  return Sentry.startTransaction({
    name,
    op,
  });
};