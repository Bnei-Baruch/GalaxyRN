#!/usr/bin/env node

/**
 * Script to synchronize versions between package.json, iOS and Android
 * Usage:
 *   node scripts/version-bump.js <newVersion> [newBuildNumber]
 *   Example: node scripts/version-bump.js 1.2.0 25
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths to files containing version information
const PACKAGE_JSON_PATH = path.join(__dirname, '../package.json');
const ANDROID_GRADLE_PATH = path.join(__dirname, '../android/app/build.gradle');
const IOS_PBXPROJ_PATH = path.join(__dirname, '../ios/GalaxyRN.xcodeproj/project.pbxproj');

// Get arguments
const newVersion = process.argv[2];
const newBuildNumber = process.argv[3];

if (!newVersion) {
  console.error('Error: New version number is required');
  console.log('Usage: node scripts/version-bump.js <newVersion> [newBuildNumber]');
  console.log('Example: node scripts/version-bump.js 1.2.0 25');
  process.exit(1);
}

// Validate version format
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('Error: Version must be in format x.y.z (e.g., 1.2.0)');
  process.exit(1);
}

// Parse version components
const [major, minor, patch] = newVersion.split('.').map(Number);

// Update package.json
console.log(`Updating package.json to version ${newVersion}`);
const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
packageJson.version = newVersion;
fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');

// Update Android version
console.log(`Updating Android versionName to ${newVersion}`);
let androidGradle = fs.readFileSync(ANDROID_GRADLE_PATH, 'utf8');

// Update versionName
androidGradle = androidGradle.replace(
  /versionName "[^"]+"/,
  `versionName "${newVersion}"`
);

// Update versionCode if provided
if (newBuildNumber) {
  console.log(`Updating Android versionCode to ${newBuildNumber}`);
  androidGradle = androidGradle.replace(
    /versionCode \d+/,
    `versionCode ${newBuildNumber}`
  );
} else {
  // If no build number provided, increment the existing one
  const versionCodeMatch = androidGradle.match(/versionCode (\d+)/);
  if (versionCodeMatch) {
    const currentCode = parseInt(versionCodeMatch[1], 10);
    const newCode = currentCode + 1;
    console.log(`Auto-incrementing Android versionCode from ${currentCode} to ${newCode}`);
    androidGradle = androidGradle.replace(
      /versionCode \d+/,
      `versionCode ${newCode}`
    );
  }
}

fs.writeFileSync(ANDROID_GRADLE_PATH, androidGradle);

// Update iOS version
console.log(`Updating iOS MARKETING_VERSION to ${newVersion}`);
let iosPbxproj = fs.readFileSync(IOS_PBXPROJ_PATH, 'utf8');

// Update MARKETING_VERSION
iosPbxproj = iosPbxproj.replace(
  /MARKETING_VERSION = [^;]+;/g,
  `MARKETING_VERSION = ${newVersion};`
);

// Update CURRENT_PROJECT_VERSION if build number provided
if (newBuildNumber) {
  console.log(`Updating iOS CURRENT_PROJECT_VERSION to ${newBuildNumber}`);
  iosPbxproj = iosPbxproj.replace(
    /CURRENT_PROJECT_VERSION = [^;]+;/g,
    `CURRENT_PROJECT_VERSION = ${newBuildNumber};`
  );
}

fs.writeFileSync(IOS_PBXPROJ_PATH, iosPbxproj);

console.log(`\n✅ Version bumped to ${newVersion}`);
if (newBuildNumber) {
  console.log(`✅ Build number set to ${newBuildNumber}`);
}
console.log('\nChanges made:');
console.log('- package.json updated');
console.log('- android/app/build.gradle updated');
console.log('- ios/GalaxyRN.xcodeproj/project.pbxproj updated'); 