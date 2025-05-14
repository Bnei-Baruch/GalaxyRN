#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const packageJson = require('../package.json');

/**
 * Helper script to validate and upload sourcemaps to Sentry
 * 
 * Usage: Set environment variables first, then run:
 * npm run sentry:validate
 * 
 * Required environment variables:
 * - SENTRY_AUTH_TOKEN
 * - SENTRY_ORG
 * - SENTRY_PROJECT
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(filepath) {
  if (!fs.existsSync(filepath)) {
    log(`Error: File not found: ${filepath}`, colors.red);
    return false;
  }
  return true;
}

function runCommand(command) {
  try {
    log(`Running: ${command}`, colors.blue);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`Command failed: ${error.message}`, colors.red);
    return false;
  }
}

function validateAndUploadSourcemaps() {
  const version = packageJson.version;
  log(`Preparing sourcemaps upload for version ${version}`, colors.green);
  
  // File paths
  const androidBundlePath = path.join(__dirname, '../android/app/src/main/assets/index.android.bundle');
  const androidSourcemapPath = path.join(__dirname, '../android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.packager.map');
  const iosBundlePath = path.join(__dirname, '../ios/main.jsbundle');
  const iosSourcemapPath = path.join(__dirname, '../ios/main.jsbundle.map');
  
  // Check for required environment variables
  const requiredEnvVars = ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    log(`Error: Missing required environment variables: ${missingEnvVars.join(', ')}`, colors.red);
    log('Make sure to set these environment variables before running this script:', colors.yellow);
    log('export SENTRY_AUTH_TOKEN=your_auth_token', colors.yellow);
    log('export SENTRY_ORG=kbb', colors.yellow);
    log('export SENTRY_PROJECT=arvut-mobile', colors.yellow);
    return false;
  }
  
  let success = true;
  
  // Check and process Android files
  const androidFilesExist = checkFile(androidBundlePath) && checkFile(androidSourcemapPath);
  if (androidFilesExist) {
    log('Android bundle and sourcemap found, uploading to Sentry...', colors.green);
    success = runCommand('npm run sentry:android') && success;
  } else {
    log('Android bundle or sourcemap missing. Run "npm run bundle:android" first.', colors.yellow);
    success = false;
  }
  
  // Check and process iOS files
  const iosFilesExist = checkFile(iosBundlePath) && checkFile(iosSourcemapPath);
  if (iosFilesExist) {
    log('iOS bundle and sourcemap found, uploading to Sentry...', colors.green);
    success = runCommand('npm run sentry:ios') && success;
  } else {
    log('iOS bundle or sourcemap missing. Run "npm run bundle:ios" first.', colors.yellow);
    success = false;
  }
  
  if (success) {
    log('✅ All sourcemaps successfully uploaded to Sentry!', colors.green);
  } else {
    log('⚠️ There were issues uploading sourcemaps to Sentry.', colors.yellow);
  }
  
  return success;
}

// Run the validation and upload process
validateAndUploadSourcemaps(); 