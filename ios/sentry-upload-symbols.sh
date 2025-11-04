#!/bin/bash

# Sentry Symbol Upload Script for iOS
# This script uploads debug symbols (dSYM) to Sentry for crash symbolication

export SENTRY_PROPERTIES=../sentry.properties

# Only upload symbols for release builds
if [ "${CONFIGURATION}" = "Release" ]; then
  echo "Uploading dSYM files to Sentry..."
  
  # Path to sentry-cli
  SENTRY_CLI="../node_modules/@sentry/cli/bin/sentry-cli"
  
  if [ -f "$SENTRY_CLI" ]; then
    # Upload dSYM files
    $SENTRY_CLI upload-dif "$DWARF_DSYM_FOLDER_PATH"
    echo "dSYM upload completed"
  else
    echo "Warning: sentry-cli not found at $SENTRY_CLI"
    echo "Skipping dSYM upload"
  fi
else
  echo "Skipping dSYM upload for debug build"
fi

