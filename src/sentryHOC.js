import React from 'react';
import * as Sentry from '@sentry/react-native';

/**
 * Higher-order component that adds Sentry error monitoring to any React component
 * @param {React.Component} Component - The component to wrap
 * @param {Object} options - Additional options for the error boundary
 * @returns {React.Component} - The wrapped component
 */
export function withErrorBoundary(Component, options = {}) {
  const componentName = Component.displayName || Component.name || 'UnknownComponent';
  
  const defaultOptions = {
    fallback: () => null, // Default fallback is just to render nothing
    ...options,
  };
  
  return Sentry.withErrorBoundary(Component, {
    ...defaultOptions,
    componentName,
  });
}

/**
 * Higher-order component that adds performance monitoring to any React component
 * @param {React.Component} Component - The component to wrap
 * @param {Object} options - Additional options for performance monitoring
 * @returns {React.Component} - The wrapped component
 */
export function withProfiler(Component, options = {}) {
  const componentName = Component.displayName || Component.name || 'UnknownComponent';
  
  return Sentry.withProfiler(Component, {
    name: componentName,
    ...options,
  });
}

/**
 * Combines both error boundary and performance profiler
 * @param {React.Component} Component - The component to wrap
 * @param {Object} errorOptions - Options for error boundary
 * @param {Object} profilerOptions - Options for profiler
 * @returns {React.Component} - The wrapped component
 */
export function withSentryMonitoring(
  Component, 
  errorOptions = {}, 
  profilerOptions = {}
) {
  return withErrorBoundary(
    withProfiler(Component, profilerOptions),
    errorOptions
  );
} 