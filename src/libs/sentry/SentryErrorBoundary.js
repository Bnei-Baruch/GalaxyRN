import * as Sentry from '@sentry/react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, StyleSheet, View } from 'react-native';
import Text from '../../components/CustomText';
import logger from '../../services/logger';

const NAMESPACE = 'SentryErrorBoundary';

/**
 * A custom error boundary component that reports errors to Sentry
 * and displays a fallback UI when an error occurs
 */
class SentryErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Report the error to Sentry
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
        ...this.props.extraData,
      },
    });

    // Log the error in development
    if (__DEV__) {
      logger.error(NAMESPACE, 'Error caught by SentryErrorBoundary:', error);
      logger.error(NAMESPACE, 'Component stack:', errorInfo.componentStack);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { fallback, children } = this.props;
    const { hasError, error } = this.state;

    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback({ error, resetError: this.resetError });
        }
        return fallback;
      }

      // Default fallback UI with translations
      return <ErrorFallback error={error} resetError={this.resetError} />;
    }

    return children;
  }
}

// Functional component to use hooks for translations
const ErrorFallback = ({ error, resetError }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('errorBoundary.title')}</Text>
      <Text style={styles.message}>{t('errorBoundary.message')}</Text>
      {__DEV__ && error && (
        <Text style={styles.errorDetails}>{error.toString()}</Text>
      )}
      <Button title={t('errorBoundary.tryAgain')} onPress={resetError} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'black',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#343a40',
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#6c757d',
  },
  errorDetails: {
    color: '#dc3545',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8d7da',
    borderRadius: 5,
    width: '100%',
  },
});

export default SentryErrorBoundary;
